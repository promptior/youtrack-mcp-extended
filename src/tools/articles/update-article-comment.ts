import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_article_comment',
  description: 'Update the text of an existing comment on a Knowledge Base article.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'ID of the article containing the comment.',
      },
      commentId: {
        type: 'string',
        description: 'ID of the comment to update.',
      },
      text: {
        type: 'string',
        description: 'New text for the comment (supports markdown).',
      },
    },
    required: ['articleId', 'commentId', 'text'],
  },
  annotations: {
    title: 'Update Article Comment',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      text: { type: 'string' },
      updated: { type: 'number' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.articleId || !ctx.commentId || !ctx.text) {
        throw new Error('Missing required parameters: articleId, commentId, and text are required');
      }

      const body = {
        text: ctx.text,
      };

      const result = apiPost(ctx, `/articles/${ctx.articleId}/comments/${ctx.commentId}`, body, {
        fields: 'id,text,created,updated',
      });

      return {
        id: result.id,
        text: result.text ?? '',
        updated: result.updated ?? null,
      };
    } catch (e: any) {
      throw new Error(`ext_update_article_comment failed: ${e.message}`);
    }
  },
};
