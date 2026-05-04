import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_current_user',
  description:
    'Get the profile of the currently authenticated user (the owner of the configured API token). Returns id, login, name, email, avatarUrl, and online status. Useful for self-referencing operations like "assign to me" or checking who the token belongs to.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  annotations: {
    title: 'Get Current User',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Internal user ID' },
      login: { type: 'string', description: 'User login name' },
      name: { type: 'string', description: 'Full display name' },
      email: { type: 'string', description: 'Email address' },
      avatarUrl: { type: 'string', description: 'URL of the user avatar image' },
      online: { type: 'boolean', description: 'Whether the user is currently online' },
    },
  },
  execute: (ctx: any) => {
    try {
      const data = apiGet(ctx, '/users/me', {
        fields: 'id,login,name,email,avatarUrl,online',
      });

      return {
        id: data.id,
        login: data.login,
        name: data.name,
        email: data.email || null,
        avatarUrl: data.avatarUrl || null,
        online: data.online || false,
      };
    } catch (e: any) {
      throw new Error(`ext_get_current_user failed: ${e.message}`);
    }
  },
};
