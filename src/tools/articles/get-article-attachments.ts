import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_article_attachments',
  description: 'Retrieve a list of all attachments (files, images, documents) associated with a knowledge base article. Includes file names, sizes, MIME types, and download URLs.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: 'The unique identifier of the article.',
      },
    },
    required: ['articleId'],
  },
  annotations: {
    title: 'Get Article Attachments',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      attachments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            size: { type: 'number' },
            mimeType: { type: 'string' },
            created: { type: 'number' },
            author: {
              type: 'object',
              properties: {
                login: { type: 'string' },
                name: { type: 'string' },
              },
            },
            url: { type: 'string' },
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

      const attachmentsData = apiGet(ctx, `/articles/${ctx.articleId}/attachments`, {
        fields: 'id,name,size,mimeType,created,author(login,name),url',
      });

      return {
        attachments: Array.isArray(attachmentsData) ? attachmentsData : [],
      };
    } catch (e: any) {
      throw new Error(`ext_get_article_attachments failed: ${e.message}`);
    }
  },
};
