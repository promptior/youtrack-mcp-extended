import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_issue_comments',
  description: 'Retrieve all comments for a specific issue. Returns comment text, author, timestamps, and deleted status. Useful for reading discussion threads and reviewing feedback on an issue.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable ID of the issue (e.g., "DEMO-123") or internal issue ID.',
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
    required: ['issueId'],
  },
  annotations: {
    title: 'Get Issue Comments',
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
            deleted: { type: 'boolean' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) {
        throw new Error('issueId is required');
      }

      const top = ctx.top ?? 50;
      const skip = ctx.skip ?? 0;

      const comments = apiGet(ctx, `/issues/${ctx.issueId}/comments`, {
        fields: 'id,text,created,updated,author(login,name),deleted',
        top,
        skip,
      });

      return {
        comments: Array.isArray(comments) ? comments : [],
      };
    } catch (e: any) {
      throw new Error(`ext_get_issue_comments failed: ${e.message}`);
    }
  },
};
