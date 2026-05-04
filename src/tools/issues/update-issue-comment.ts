import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_issue_comment',
  description:
    'Update the text of an existing comment on an issue. Allows editing comment content after posting. Only the comment author or administrators can typically update comments.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'ID or key of the issue (e.g., "DEMO-123")' },
      commentId: { type: 'string', description: 'ID of the comment to update' },
      text: { type: 'string', description: 'New comment text (supports Markdown)' },
    },
    required: ['issueId', 'commentId', 'text'],
  },
  annotations: {
    title: 'Update issue comment',
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
      updated: { type: 'number' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId parameter is required');
      if (!ctx.commentId) throw new Error('commentId parameter is required');
      if (!ctx.text) throw new Error('text parameter is required');

      const data = apiPost(
        ctx,
        `/issues/${ctx.issueId}/comments/${ctx.commentId}`,
        { text: ctx.text },
        { fields: 'id,text,updated' }
      );

      return {
        id: data.id,
        text: data.text,
        updated: data.updated,
      };
    } catch (e: any) {
      throw new Error(`ext_update_issue_comment failed: ${e.message}`);
    }
  },
};
