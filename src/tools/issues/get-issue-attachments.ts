import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_issue_attachments',
  description: 'Retrieve all file attachments associated with a specific issue. Returns file names, sizes, MIME types, creation dates, and uploader information. Useful for accessing issue documentation, screenshots, and supporting files.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable ID of the issue (e.g., "DEMO-123") or internal issue ID.',
      },
    },
    required: ['issueId'],
  },
  annotations: {
    title: 'Get Issue Attachments',
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
            extension: { type: 'string' },
            url: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                login: { type: 'string' },
                name: { type: 'string' },
              },
            },
            created: { type: 'number' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId is required');

      const items = apiGet(ctx, `/issues/${ctx.issueId}/attachments`, {
        fields: 'id,name,size,mimeType,extension,url,author(login,name),created',
      });

      return { attachments: items };
    } catch (e: any) {
      throw new Error(`ext_get_issue_attachments failed: ${e.message}`);
    }
  },
};
