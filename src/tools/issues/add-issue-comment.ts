import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'add_issue_comment',
  description:
    'Add a comment to an issue. Supports plain text or Markdown formatting. Returns the comment ID and metadata for reference.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'ID or key of the issue (e.g., "DEMO-123")' },
      text: { type: 'string', description: 'Comment text (supports Markdown)' },
    },
    required: ['issueId', 'text'],
  },
  annotations: {
    title: 'Add issue comment',
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
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId parameter is required');
      if (!ctx.text) throw new Error('text parameter is required');

      const data = apiPost(
        ctx,
        `/issues/${ctx.issueId}/comments`,
        { text: ctx.text },
        { fields: 'id,text,author(login,name),created' }
      );

      return {
        id: data.id,
        text: data.text,
        author: data.author,
        created: data.created,
      };
    } catch (e: any) {
      throw new Error(`ext_add_issue_comment failed: ${e.message}`);
    }
  },
};
