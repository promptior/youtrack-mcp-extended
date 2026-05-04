import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_article',
  description: 'Update an existing Knowledge Base article. Can update the summary (title) and/or content of an article.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'ID of the article to update.',
      },
      summary: {
        type: 'string',
        description: 'New title for the article (optional).',
      },
      content: {
        type: 'string',
        description: 'New content for the article (optional, supports markdown).',
      },
    },
    required: ['articleId'],
  },
  annotations: {
    title: 'Update Article',
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
      idReadable: { type: 'string' },
      summary: { type: 'string' },
      content: { type: 'string' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.articleId) {
        throw new Error('Missing required parameter: articleId');
      }

      const body: any = {};
      if (ctx.summary !== undefined) body.summary = ctx.summary;
      if (ctx.content !== undefined) body.content = ctx.content;

      const result = apiPost(ctx, `/articles/${ctx.articleId}`, body, {
        fields: 'id,idReadable,summary,content',
      });

      return {
        id: result.id,
        idReadable: result.idReadable ?? '',
        summary: result.summary ?? '',
        content: result.content ?? '',
      };
    } catch (e: any) {
      throw new Error(`ext_update_article failed: ${e.message}`);
    }
  },
};
