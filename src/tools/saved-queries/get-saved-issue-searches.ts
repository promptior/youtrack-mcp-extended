import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_saved_issue_searches',
  description:
    'Retrieve a list of saved issue searches (saved queries) from YouTrack. Returns each query with its id, name, query string, and owner. Useful for discovering existing saved searches before creating duplicates or applying them programmatically.',
  inputSchema: {
    type: 'object',
    properties: {
      top: {
        type: 'number',
        description: 'Maximum number of saved queries to return (default 50)',
      },
      skip: {
        type: 'number',
        description: 'Number of saved queries to skip for pagination (default 0)',
      },
    },
    required: [],
  },
  annotations: {
    title: 'Get Saved Issue Searches',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      savedQueries: {
        type: 'array',
        description: 'List of saved queries',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            query: { type: 'string' },
            owner: { type: 'object' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      const top = ctx.top || 50;
      const skip = ctx.skip || 0;

      const data = apiGet(ctx, '/savedQueries', {
        fields: 'id,name,query,owner(login,name),isShareableWithProjects',
        top,
        skip,
      });

      const queries = Array.isArray(data) ? data : [];

      return {
        savedQueries: queries.map((q: any) => ({
          id: q.id,
          name: q.name,
          query: q.query,
          owner: q.owner ? { login: q.owner.login, name: q.owner.name } : null,
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_get_saved_issue_searches failed: ${e.message}`);
    }
  },
};
