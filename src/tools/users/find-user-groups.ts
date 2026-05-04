import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'find_user_groups',
  description:
    'List and search user groups in the YouTrack instance. Returns groups with their name, description, and member count. Useful for managing permissions or finding which groups exist before assigning users.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Filter groups by name (case-insensitive substring match, optional)',
      },
      top: {
        type: 'number',
        description: 'Maximum number of groups to return (default 50)',
      },
      skip: {
        type: 'number',
        description: 'Number of groups to skip for pagination (default 0)',
      },
    },
    required: [],
  },
  annotations: {
    title: 'Find User Groups',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      groups: {
        type: 'array',
        description: 'List of user groups',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            usersCount: { type: 'number' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      const top = ctx.top || 50;
      const skip = ctx.skip || 0;

      const data = apiGet(ctx, '/groups', {
        fields: 'id,name,description,usersCount',
        top,
        skip,
      });

      const groups = Array.isArray(data) ? data : [];

      const filtered = ctx.query
        ? groups.filter((g: any) =>
            g.name && g.name.toLowerCase().includes(String(ctx.query).toLowerCase())
          )
        : groups;

      return {
        groups: filtered.map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description || null,
          usersCount: g.usersCount || 0,
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_find_user_groups failed: ${e.message}`);
    }
  },
};
