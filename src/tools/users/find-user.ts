import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'find_user',
  description:
    'Search for users in the YouTrack instance by name or login. Returns matching users with their login, name, email, and avatar. Useful for quickly finding a specific user to assign to issues or look up by partial name.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Name or login to search for (required)',
      },
      top: {
        type: 'number',
        description: 'Maximum number of users to return (default 10)',
      },
    },
    required: ['query'],
  },
  annotations: {
    title: 'Find User',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        description: 'List of users matching the search query',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            login: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            avatarUrl: { type: 'string' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.query) throw new Error('query is required');

      const top = ctx.top || 10;

      const data = apiGet(ctx, '/users', {
        fields: 'id,login,name,email,avatarUrl,online,banned',
        query: ctx.query,
        top,
      });

      const users = Array.isArray(data) ? data : [];

      return {
        users: users.map((u: any) => ({
          id: u.id,
          login: u.login,
          name: u.name,
          email: u.email || null,
          avatarUrl: u.avatarUrl || null,
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_find_user failed: ${e.message}`);
    }
  },
};
