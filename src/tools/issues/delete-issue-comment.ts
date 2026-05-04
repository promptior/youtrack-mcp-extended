import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_issue_comment',
  description:
    'Delete a comment from an issue. This is destructive and cannot be undone. The comment will be permanently removed.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'ID or key of the issue (e.g., "DEMO-123")' },
      commentId: { type: 'string', description: 'ID of the comment to delete' },
    },
    required: ['issueId', 'commentId'],
  },
  annotations: {
    title: 'Delete issue comment',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId parameter is required');
      if (!ctx.commentId) throw new Error('commentId parameter is required');

      apiDelete(ctx, `/issues/${ctx.issueId}/comments/${ctx.commentId}`);

      return { success: true };
    } catch (e: any) {
      throw new Error(`ext_delete_issue_comment failed: ${e.message}`);
    }
  },
};
