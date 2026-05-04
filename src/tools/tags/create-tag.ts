import { apiPost, apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'create_tag',
  description:
    'Create a new tag in the YouTrack instance. Allows setting the tag name and optionally a color. Returns the created tag ID and details.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name of the new tag (must be unique)' },
      colorId: { type: 'string', description: 'Optional color ID for the tag (e.g., "red", "blue")' },
    },
    required: ['name'],
  },
  annotations: {
    title: 'Create tag',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      colorId: { type: ['string', 'null'] },
      owner: { type: ['object', 'null'] },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.name) throw new Error('name parameter is required');

      const body: any = { name: ctx.name };
      if (ctx.colorId) {
        body.color = { id: ctx.colorId };
      }

      const result = apiPost(ctx, '/tags', body, {
        fields: 'id,name,color(id,background,foreground),owner(login,name)',
      });

      // YouTrack silently falls back to colorId "0" when given an unknown
      // colour. The POST has already created the tag at this point, so we
      // also need to roll it back — otherwise the caller sees an error but
      // the (wrong-coloured) tag stays orphaned in the instance.
      const appliedColorId = result.color?.id ?? null;
      if (ctx.colorId && appliedColorId !== ctx.colorId) {
        if (result.id) {
          try { apiDelete(ctx, `/tags/${result.id}`); } catch { /* best-effort cleanup */ }
        }
        throw new Error(
          `colorId "${ctx.colorId}" was rejected by YouTrack (would have created the tag with fallback colorId "${appliedColorId}"). The tag was rolled back. Pass a valid colorId or omit the field.`
        );
      }

      return {
        id: result.id,
        name: result.name ?? '',
        colorId: appliedColorId,
        owner: result.owner ?? null,
      };
    } catch (e: any) {
      throw new Error(`ext_create_tag failed: ${e.message}`);
    }
  },
};
