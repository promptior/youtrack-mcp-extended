import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'find_projects',
  description:
    'List and search projects in the YouTrack instance. Returns project details including name, shortName, description, and leader. Useful for discovering available projects before creating issues or filtering by project.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Filter projects by name (case-insensitive substring match, optional)',
      },
      top: {
        type: 'number',
        description: 'Maximum number of projects to return (default 50)',
      },
      skip: {
        type: 'number',
        description: 'Number of projects to skip for pagination (default 0)',
      },
    },
    required: [],
  },
  annotations: {
    title: 'Find Projects',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      projects: {
        type: 'array',
        description: 'List of matching projects',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            shortName: { type: 'string' },
            description: { type: 'string' },
            leader: { type: 'object' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      const top = ctx.top || 50;
      const skip = ctx.skip || 0;

      const opts: Record<string, any> = {
        fields: 'id,name,shortName,description,leader(login,name),createdBy(login)',
        top,
        skip,
      };
      if (ctx.query) opts.query = String(ctx.query);

      const data = apiGet(ctx, '/admin/projects', opts);

      const projects = Array.isArray(data) ? data : [];

      return {
        projects: projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          shortName: p.shortName,
          description: p.description || null,
          leader: p.leader
            ? { login: p.leader.login, name: p.leader.name }
            : null,
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_find_projects failed: ${e.message}`);
    }
  },
};
