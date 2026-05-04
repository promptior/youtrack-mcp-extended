import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_article_comments',
  description: 'Retrieve comments on a specific article including comment text, author information, creation/update timestamps, and reactions. Useful for viewing discussions and feedback on knowledge base articles.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'The unique identifier of the article.',
      },
      top: {
        type: 'number',
        description: 'Maximum number of comments to return. Default is 50.',
        default: 50,
      },
      skip: {
        type: 'number',
        description: 'Number of comments to skip (for pagination). Default is 0.',
        default: 0,
      },
    },
    required: ['articleId'],
  },
  annotations: {
    title: 'Get Article Comments',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      comments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            created: { type: 'number' },
            updated: { type: 'number' },
            author: {
              type: 'object',
              properties: {
                login: { type: 'string' },
                name: { type: 'string' },
              },
            },
            reactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  reaction: { type: 'string' },
                  author: {
                    type: 'object',
                    properties: {
                      login: { type: 'string' },
                    },
                  },
                },
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

      const top = ctx.top ?? 50;
      const skip = ctx.skip ?? 0;

      const commentsData = apiGet(ctx, `/articles/${ctx.articleId}/comments`, {
        fields: 'id,text,created,updated,author(login,name)',
        top,
        skip,
      });

      return {
        comments: Array.isArray(commentsData) ? commentsData : [],
      };
    } catch (e: any) {
      throw new Error(`ext_get_article_comments failed: ${e.message}`);
    }
  },
};
