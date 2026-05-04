import { apiPost, apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'create_saved_query',
  description:
    'Creates a new saved query in YouTrack. Saved queries allow storing frequently used search queries for quick access. Returns the created query details with ID, name, and the query string.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name for the saved query (e.g., "My Open Issues", "High Priority Bugs")',
      },
      query: {
        type: 'string',
        description:
          'YouTrack query string (e.g., "project: DEMO and State: Open and Priority: Critical")',
      },
      isShared: {
        type: 'boolean',
        description: 'Whether the query should be shared with all projects. Default: false',
      },
    },
    required: ['name', 'query'],
  },
  annotations: {
    title: 'Create Saved Query',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier of the created saved query',
      },
      name: {
        type: 'string',
        description: 'Name of the saved query',
      },
      query: {
        type: 'string',
        description: 'The query string',
      },
    },
    required: ['id', 'name', 'query'],
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.name || typeof ctx.name !== 'string') {
        throw new Error('name is required and must be a string');
      }
      if (!ctx.query || typeof ctx.query !== 'string') {
        throw new Error('query is required and must be a string');
      }

      // Resolver el ID real del usuario autenticado — la API rechaza el literal "me"
      const me = apiGet(ctx, '/users/me', { fields: 'id' });

      const body = {
        name: ctx.name,
        query: ctx.query,
        owner: { id: me.id },
        shareAllProjects: ctx.isShared ?? false,
      };

      const result = apiPost(ctx, '/savedQueries', body, {
        fields: 'id,name,query',
      });

      return {
        id: result.id,
        name: result.name,
        query: result.query,
      };
    } catch (e: any) {
      throw new Error(`ext_create_saved_query failed: ${e.message}`);
    }
  },
};
