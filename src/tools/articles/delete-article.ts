import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_article',
  description: 'Delete a Knowledge Base article. This action is irreversible. The article and all its child articles will be deleted.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'ID of the article to delete.',
      },
    },
    required: ['articleId'],
  },
  annotations: {
    title: 'Delete Article',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.articleId) {
        throw new Error('Missing required parameter: articleId');
      }

      apiDelete(ctx, `/articles/${ctx.articleId}`);

      return {
        success: true,
      };
    } catch (e: any) {
      throw new Error(`ext_delete_article failed: ${e.message}`);
    }
  },
};
