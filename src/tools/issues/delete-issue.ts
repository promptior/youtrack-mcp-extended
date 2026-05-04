import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_issue',
  description:
    'Permanently delete an issue from the YouTrack instance. This is destructive and cannot be undone. The issue will be completely removed. Use with caution.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'ID or key of the issue to delete (e.g., "DEMO-123")' },
    },
    required: ['issueId'],
  },
  annotations: {
    title: 'Delete issue',
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

      apiDelete(ctx, `/issues/${ctx.issueId}`);

      return { success: true };
    } catch (e: any) {
      throw new Error(`ext_delete_issue failed: ${e.message}`);
    }
  },
};
