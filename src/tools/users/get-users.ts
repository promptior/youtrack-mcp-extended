import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_users',
  description:
    'Search and retrieve users from the YouTrack instance. Returns user info including login, name, email, and online status. Useful for finding users to assign issues or check team members.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Filter users by name or login (optional)' },
      top: { type: 'number', description: 'Maximum number of users to return (default 50)' },
      skip: { type: 'number', description: 'Number of users to skip for pagination (default 0)' },
    },
    required: [],
  },
  annotations: {
    title: 'Get users',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      users: { type: 'array' },
      returnedCount: { type: 'number', description: 'Number of users in this page (not the global total).' },
      hasMore: { type: 'boolean', description: 'True if there is at least one more page (top+1 sentinel).' },
    },
  },
  execute: (ctx: any) => {
    try {
      const fields = 'id,login,name,email,online,banned';
      const top = ctx.top || 50;
      const skip = ctx.skip || 0;
      // Request top+1 so we can infer hasMore without an extra count call.
      const options: any = { fields, top: top + 1, skip };
      if (ctx.query) options.query = ctx.query;

      const data = apiGet(ctx, '/users', options);

      const raw = Array.isArray(data) ? data : [];
      const hasMore = raw.length > top;
      const sliced = raw.slice(0, top);
      return {
        users: sliced.map((u: any) => ({
          id: u.id,
          login: u.login,
          name: u.name,
          email: u.email,
          online: u.online || false,
          banned: u.banned || false,
        })),
        returnedCount: sliced.length,
        hasMore,
      };
    } catch (e: any) {
      throw new Error(`ext_get_users failed: ${e.message}`);
    }
  },
};
