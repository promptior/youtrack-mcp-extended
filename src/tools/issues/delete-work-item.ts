import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_work_item',
  description: 'Delete a work item (time tracking record) from an issue. This action is irreversible.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'Issue ID (e.g. "DEMO-123")' },
      workItemId: { type: 'string', description: 'Work item ID to delete' },
    },
    required: ['issueId', 'workItemId'],
  },
  annotations: {
    title: 'Delete work item',
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
      if (!ctx.workItemId) throw new Error('workItemId is required');

      apiDelete(ctx, `/issues/${ctx.issueId}/timeTracking/workItems/${ctx.workItemId}`);
      return { success: true };
    } catch (e: any) {
      throw new Error(`ext_delete_work_item failed: ${e.message}`);
    }
  },
};
