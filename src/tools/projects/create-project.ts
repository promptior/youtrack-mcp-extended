import { apiGet, apiPost } from '../../lib/api-client';

function resolveLeaderId(ctx: any, login: string): string {
  const user = apiGet(ctx, `/users/${encodeURIComponent(login)}`, { fields: 'id,login' });
  if (!user || !user.id) {
    throw new Error(`Unknown leader login "${login}"`);
  }
  return user.id;
}

exports.aiTool = {
  name: 'create_project',
  description:
    'Create a new YouTrack project. Requires a name and shortName (issue ID prefix, e.g. "DEMO"). Optionally accepts a description and a leaderLogin; if leaderLogin is omitted, the project leader defaults to the current authenticated user.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Display name of the new project (e.g., "Demo Project").',
      },
      shortName: {
        type: 'string',
        description: 'Short name used as the issue ID prefix (e.g., "DEMO" → DEMO-1, DEMO-2…). Must be unique.',
      },
      description: {
        type: 'string',
        description: 'Optional project description.',
      },
      leaderLogin: {
        type: 'string',
        description: 'Optional login of the user to set as project leader. Defaults to the current authenticated user.',
      },
    },
    required: ['name', 'shortName'],
  },
  annotations: {
    title: 'Create Project',
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
      shortName: { type: 'string' },
      description: { type: 'string' },
      leader: { type: 'object' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.name) throw new Error('name is required');
      if (!ctx.shortName) throw new Error('shortName is required');

      const leaderId = ctx.leaderLogin
        ? resolveLeaderId(ctx, ctx.leaderLogin)
        : (apiGet(ctx, '/users/me', { fields: 'id' }) as any).id;

      const body: any = {
        name: ctx.name,
        shortName: ctx.shortName,
        leader: { id: leaderId },
      };
      if (ctx.description !== undefined) body.description = ctx.description;

      const result = apiPost(ctx, '/admin/projects', body, {
        fields: 'id,name,shortName,description,leader(login,name)',
      });

      return {
        id: result.id,
        name: result.name,
        shortName: result.shortName,
        description: result.description || null,
        leader: result.leader
          ? { login: result.leader.login, name: result.leader.name }
          : null,
      };
    } catch (e: any) {
      throw new Error(`ext_create_project failed: ${e.message}`);
    }
  },
};
