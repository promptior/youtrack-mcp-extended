import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_user_group_members',
  description:
    'Get the list of members belonging to a specific YouTrack user group. Returns user details including login, name, and email. Useful for auditing group membership or finding users to assign.',
  inputSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'ID of the user group',
      },
      top: {
        type: 'number',
        description: 'Maximum number of members to return (default 50)',
      },
      skip: {
        type: 'number',
        description: 'Number of members to skip for pagination (default 0)',
      },
    },
    required: ['groupId'],
  },
  annotations: {
    title: 'Get User Group Members',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      members: {
        type: 'array',
        description: 'List of users in the group',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            login: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.groupId) throw new Error('groupId is required');

      const top = ctx.top || 50;
      const skip = ctx.skip || 0;

      const data = apiGet(ctx, `/groups/${encodeURIComponent(ctx.groupId)}/users`, {
        fields: 'id,login,name,email',
        top,
        skip,
      });

      const members = Array.isArray(data) ? data : [];

      return {
        members: members.map((u: any) => ({
          id: u.id,
          login: u.login,
          name: u.name,
          email: u.email || null,
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_get_user_group_members failed: ${e.message}`);
    }
  },
};
