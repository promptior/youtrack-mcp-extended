import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_article',
  description: 'Retrieve the complete content of a specific knowledge base article. Includes full article text, author information, project details, tags, child articles, parent article hierarchy, and attachments.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'The unique identifier of the article to retrieve.',
      },
    },
    required: ['articleId'],
  },
  annotations: {
    title: 'Get Article',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      article: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          idReadable: { type: 'string' },
          summary: { type: 'string' },
          content: { type: 'string' },
          created: { type: 'number' },
          updated: { type: 'number' },
          author: {
            type: 'object',
            properties: {
              login: { type: 'string' },
              name: { type: 'string' },
            },
          },
          project: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
          childArticles: { type: 'array' },
          parentArticle: { type: 'object' },
          attachments: { type: 'array' },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.articleId) {
        throw new Error('articleId is required');
      }

      const article = apiGet(ctx, `/articles/${ctx.articleId}`, {
        fields: 'id,idReadable,summary,content,created,updated,author(login,name),project(id,name),tags(name),childArticles(id,idReadable,summary),parentArticle(id,idReadable,summary),attachments(id,name,size)',
      });

      return {
        article,
      };
    } catch (e: any) {
      throw new Error(`ext_get_article failed: ${e.message}`);
    }
  },
};
