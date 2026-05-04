import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_saved_query',
  description:
    'Updates an existing saved query in YouTrack. Can modify the query name and/or the query string. Returns the updated query details.',
  inputSchema: {
    type: 'object',
    properties: {
      queryId: {
        type: 'string',
        description: 'ID of the saved query to update',
      },
      name: {
        type: 'string',
        description: 'New name for the saved query (optional)',
      },
      query: {
        type: 'string',
        description: 'New YouTrack query string (optional)',
      },
    },
    required: ['queryId'],
  },
  annotations: {
    title: 'Update Saved Query',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the updated saved query',
      },
      name: {
        type: 'string',
        description: 'Updated name',
      },
      query: {
        type: 'string',
        description: 'Updated query string',
      },
    },
    required: ['id', 'name', 'query'],
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.queryId || typeof ctx.queryId !== 'string') {
        throw new Error('queryId is required and must be a string');
      }

      const body: any = {};
      if (ctx.name !== undefined) {
        body.name = ctx.name;
      }
      if (ctx.query !== undefined) {
        body.query = ctx.query;
      }

      const result = apiPost(ctx, `/savedQueries/${ctx.queryId}`, body, {
        fields: 'id,name,query',
      });

      return {
        id: result.id,
        name: result.name,
        query: result.query,
      };
    } catch (e: any) {
      throw new Error(`ext_update_saved_query failed: ${e.message}`);
    }
  },
};
