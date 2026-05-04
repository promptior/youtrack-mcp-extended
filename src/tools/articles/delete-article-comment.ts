import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_article_comment',
  description: 'Delete a comment from a Knowledge Base article. This action is irreversible.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'ID of the article containing the comment.',
      },
      commentId: {
        type: 'string',
        description: 'ID of the comment to delete.',
      },
    },
    required: ['articleId', 'commentId'],
  },
  annotations: {
    title: 'Delete Article Comment',
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
      if (!ctx.articleId || !ctx.commentId) {
        throw new Error('Missing required parameters: articleId and commentId are required');
      }

      apiDelete(ctx, `/articles/${ctx.articleId}/comments/${ctx.commentId}`);

      return {
        success: true,
      };
    } catch (e: any) {
      throw new Error(`ext_delete_article_comment failed: ${e.message}`);
    }
  },
};
