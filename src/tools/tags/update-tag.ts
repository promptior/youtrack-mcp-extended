import { apiGet, apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_tag',
  description: 'Update an existing tag in YouTrack. Can update the tag name and optionally change its color.',
  inputSchema: {
    type: 'object',
    properties: {
      tagId: {
        type: 'string',
        description: 'ID of the tag to update.',
      },
      name: {
        type: 'string',
        description: 'New name for the tag (optional).',
      },
      colorId: {
        type: 'string',
        description: 'New color ID for the tag (optional). Example color IDs: "red", "blue", "green", etc.',
      },
    },
    required: ['tagId'],
  },
  annotations: {
    title: 'Update Tag',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      colorId: { type: ['string', 'null'] },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.tagId) {
        throw new Error('Missing required parameter: tagId');
      }

      const body: any = {};
      if (ctx.name !== undefined) body.name = ctx.name;
      if (ctx.colorId !== undefined) {
        body.color = {
          id: ctx.colorId,
        };
      }

      // YouTrack does NOT just ignore an unknown colorId — it *degrades* the
      // tag's stored colour to "0" (the no-colour fallback) AND, if a name
      // was passed, applies it. So before writing, snapshot whatever the
      // caller could clobber so we can put it back if the colour write fails.
      let previousName: string | undefined;
      let previousColorId: string | undefined;
      if (ctx.colorId !== undefined) {
        try {
          const before: any = apiGet(ctx, `/tags/${ctx.tagId}`, { fields: 'name,color(id)' });
          if (typeof before?.name === 'string') previousName = before.name;
          if (typeof before?.color?.id === 'string') previousColorId = before.color.id;
        } catch { /* if the pre-fetch fails we still want to attempt the update */ }
      }

      const result = apiPost(ctx, `/tags/${ctx.tagId}`, body, {
        fields: 'id,name,color(id,background,foreground)',
      });

      // Detect colour-write rejection (response colorId differs from request).
      // On rejection: roll BOTH the colour and (if the caller asked) the name
      // back to their pre-update values so the operation is atomic from the
      // caller's point of view.
      const appliedColorId = result.color?.id ?? null;
      if (ctx.colorId !== undefined && appliedColorId !== ctx.colorId) {
        const rollbackBody: any = {};
        let rolledBackName = false;
        let rolledBackColor = false;
        if (previousName !== undefined && ctx.name !== undefined && previousName !== ctx.name) {
          rollbackBody.name = previousName;
          rolledBackName = true;
        }
        if (previousColorId !== undefined && previousColorId !== appliedColorId) {
          rollbackBody.color = { id: previousColorId };
          rolledBackColor = true;
        }
        if (rolledBackName || rolledBackColor) {
          try {
            apiPost(ctx, `/tags/${ctx.tagId}`, rollbackBody, { fields: 'id' });
          } catch { /* best-effort rollback */ }
        }
        const rollbackBits: string[] = [];
        if (rolledBackName) rollbackBits.push('name');
        if (rolledBackColor) rollbackBits.push('previous colour');
        const rollbackNote = rollbackBits.length > 0
          ? ` The ${rollbackBits.join(' and ')} ${rollbackBits.length > 1 ? 'were' : 'was'} rolled back.`
          : '';
        throw new Error(
          `colorId "${ctx.colorId}" was rejected by YouTrack (would have degraded the tag colour to "${appliedColorId}").${rollbackNote} Pass a valid colorId or omit the field.`
        );
      }

      return {
        id: result.id,
        name: result.name ?? '',
        colorId: appliedColorId,
      };
    } catch (e: any) {
      throw new Error(`ext_update_tag failed: ${e.message}`);
    }
  },
};
