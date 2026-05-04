import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_user_profile',
  description: 'Retrieve detailed profile information for a specific user. Returns general profile information including email, avatar, timezone, locale, and other user-specific settings.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID or login name of the user. Can be either the user login (e.g., "user@company.com") or the internal user ID.',
      },
    },
    required: ['userId'],
  },
  annotations: {
    title: 'Get User Profile',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          login: { type: 'string' },
          name: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string' },
          avatarUrl: { type: 'string' },
          banned: { type: 'boolean' },
          online: { type: 'boolean' },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.userId) {
        throw new Error('Missing required parameter: userId');
      }

      const result = apiGet(ctx, `/users/${encodeURIComponent(ctx.userId)}`, {
        fields: 'id,login,name,fullName,email,avatarUrl,banned,online',
      });

      return {
        user: {
          id: result.id,
          login: result.login,
          name: result.name,
          fullName: result.fullName || result.name,
          email: result.email || null,
          avatarUrl: result.avatarUrl || null,
          banned: result.banned || false,
          online: result.online || false,
        },
      };
    } catch (e: any) {
      throw new Error(`ext_get_user_profile failed: ${e.message}`);
    }
  },
};
