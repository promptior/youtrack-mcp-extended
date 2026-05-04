import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_saved_query',
  description:
    'Permanently deletes a saved query from YouTrack. This action cannot be undone. Returns success confirmation.',
  inputSchema: {
    type: 'object',
    properties: {
      queryId: {
        type: 'string',
        description: 'ID of the saved query to delete',
      },
    },
    required: ['queryId'],
  },
  annotations: {
    title: 'Delete Saved Query',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the saved query was successfully deleted',
      },
    },
    required: ['success'],
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.queryId || typeof ctx.queryId !== 'string') {
        throw new Error('queryId is required and must be a string');
      }

      apiDelete(ctx, `/savedQueries/${ctx.queryId}`);

      return {
        success: true,
      };
    } catch (e: any) {
      throw new Error(`ext_delete_saved_query failed: ${e.message}`);
    }
  },
};
