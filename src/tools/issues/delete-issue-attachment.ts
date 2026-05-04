import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_issue_attachment',
  description: 'Delete a file attachment from an issue. This action is irreversible.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'Issue ID (e.g. "DEMO-123")' },
      attachmentId: { type: 'string', description: 'Attachment ID to delete' },
    },
    required: ['issueId', 'attachmentId'],
  },
  annotations: {
    title: 'Delete issue attachment',
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
      if (!ctx.issueId) throw new Error('issueId is required');
      if (!ctx.attachmentId) throw new Error('attachmentId is required');

      apiDelete(ctx, `/issues/${ctx.issueId}/attachments/${ctx.attachmentId}`);
      return { success: true };
    } catch (e: any) {
      throw new Error(`ext_delete_issue_attachment failed: ${e.message}`);
    }
  },
};
