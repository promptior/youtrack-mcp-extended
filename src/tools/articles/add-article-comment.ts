import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'add_article_comment',
  description: 'Add a comment to a Knowledge Base article. Comments can include markdown formatting.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'ID of the article to comment on.',
      },
      text: {
        type: 'string',
        description: 'The comment text (supports markdown).',
      },
    },
    required: ['articleId', 'text'],
  },
  annotations: {
    title: 'Add Article Comment',
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
      text: { type: 'string' },
      created: { type: 'number' },
      author: { type: ['object', 'null'] },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.articleId || !ctx.text) {
        throw new Error('Missing required parameters: articleId and text are required');
      }

      const body = {
        text: ctx.text,
        usesMarkdown: true,
      };

      const result = apiPost(ctx, `/articles/${ctx.articleId}/comments`, body, {
        fields: 'id,text,created,author(login,name)',
      });

      return {
        id: result.id,
        text: result.text ?? '',
        created: result.created ?? null,
        author: result.author ?? null,
      };
    } catch (e: any) {
      throw new Error(`ext_add_article_comment failed: ${e.message}`);
    }
  },
};
