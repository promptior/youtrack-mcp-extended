import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_sub_articles',
  description: 'Retrieve child articles nested under a specific parent article. Includes titles, readable IDs, author information, and creation/update timestamps. Useful for exploring hierarchical article structures.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'The unique identifier of the parent article.',
      },
    },
    required: ['articleId'],
  },
  annotations: {
    title: 'Get Sub Articles',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      childArticles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            idReadable: { type: 'string' },
            summary: { type: 'string' },
            created: { type: 'number' },
            updated: { type: 'number' },
            author: {
              type: 'object',
              properties: {
                login: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.articleId) {
        throw new Error('articleId is required');
      }

      const result = apiGet(ctx, `/articles/${ctx.articleId}`, {
        fields: 'childArticles(id,idReadable,summary,created,updated,author(login,name))',
      });

      return {
        childArticles: result.childArticles ?? [],
      };
    } catch (e: any) {
      throw new Error(`ext_get_sub_articles failed: ${e.message}`);
    }
  },
};
