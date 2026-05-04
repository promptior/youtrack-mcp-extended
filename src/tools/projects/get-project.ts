import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_project',
  description:
    'Get detailed information about a specific YouTrack project by its ID or shortName. Returns full project details including name, description, leader, archived status, and template flag.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or shortName (e.g., "DEMO" or the internal ID)',
      },
    },
    required: ['projectId'],
  },
  annotations: {
    title: 'Get Project',
    readOnlyHint: true,
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
      shortName: { type: 'string' },
      description: { type: 'string' },
      leader: { type: 'object' },
      createdBy: { type: 'object' },
      archived: { type: 'boolean' },
      template: { type: 'boolean' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.projectId) throw new Error('projectId is required');

      const data = apiGet(ctx, `/admin/projects/${encodeURIComponent(ctx.projectId)}`, {
        fields: 'id,name,shortName,description,leader(login,name),createdBy(login,name),archived,template',
      });

      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        description: data.description || null,
        leader: data.leader ? { login: data.leader.login, name: data.leader.name } : null,
        createdBy: data.createdBy ? { login: data.createdBy.login, name: data.createdBy.name } : null,
        archived: data.archived || false,
        template: data.template || false,
      };
    } catch (e: any) {
      throw new Error(`ext_get_project failed: ${e.message}`);
    }
  },
};
