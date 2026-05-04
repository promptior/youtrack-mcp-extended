import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_tags',
  description:
    'Retrieve all tags in the YouTrack instance. Returns tag names, colors, and ownership info. Useful for understanding available tags before applying them to issues.',
  inputSchema: {
    type: 'object',
    properties: {
      top: {
        type: 'number',
        description: 'Maximum number of tags to return (default 100)',
      },
      skip: {
        type: 'number',
        description: 'Number of tags to skip for pagination (default 0)',
      },
    },
    required: [],
  },
  annotations: {
    title: 'Get all tags',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      tags: {
        type: 'array',
      },
      returnedCount: { type: 'number', description: 'Number of tags in this page (not the global total).' },
      hasMore: { type: 'boolean', description: 'True if there is at least one more page (top+1 sentinel).' },
    },
  },
  execute: (ctx: any) => {
    try {
      const fields = 'id,name,color(id,background,foreground),owner(login,name)';
      const top = ctx.top || 100;
      const skip = ctx.skip || 0;

      // Request top+1 so we can infer hasMore without an extra count call.
      const data = apiGet(ctx, '/tags', { fields, top: top + 1, skip });
      const raw = Array.isArray(data) ? data : [];
      const hasMore = raw.length > top;
      const sliced = raw.slice(0, top);

      return {
        tags: sliced.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color ? { id: t.color.id, background: t.color.background, foreground: t.color.foreground } : null,
          owner: t.owner ? { login: t.owner.login, name: t.owner.name } : null,
        })),
        returnedCount: sliced.length,
        hasMore,
      };
    } catch (e: any) {
      throw new Error(`ext_get_tags failed: ${e.message}`);
    }
  },
};
