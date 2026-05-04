import { apiPost, apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'manage_issue_tags',
  description: 'Add or remove a tag from an issue. Use action "add" to attach a tag to an issue, or "remove" to detach it. The tagId must be the internal ID of the tag (use ext_get_tags to find tag IDs).',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable ID of the issue (e.g., "DEMO-123") or internal issue ID.',
      },
      tagId: {
        type: 'string',
        description: 'The internal ID of the tag to add or remove.',
      },
      action: {
        type: 'string',
        description: 'Action to perform: "add" to attach the tag, "remove" to detach the tag.',
        enum: ['add', 'remove'],
      },
    },
    required: ['issueId', 'tagId', 'action'],
  },
  annotations: {
    title: 'Manage Issue Tags',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      action: { type: 'string' },
      issueId: { type: 'string' },
      tagId: { type: 'string' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) {
        throw new Error('issueId is required');
      }
      if (!ctx.tagId) {
        throw new Error('tagId is required');
      }
      if (!ctx.action) {
        throw new Error('action is required');
      }
      if (ctx.action !== 'add' && ctx.action !== 'remove') {
        throw new Error('action must be "add" or "remove"');
      }

      if (ctx.action === 'add') {
        apiPost(ctx, `/issues/${ctx.issueId}/tags`, { id: ctx.tagId }, {
          fields: 'id,name',
        });
      } else {
        apiDelete(ctx, `/issues/${ctx.issueId}/tags/${ctx.tagId}`);
      }

      return {
        success: true,
        action: ctx.action,
        issueId: ctx.issueId,
        tagId: ctx.tagId,
      };
    } catch (e: any) {
      throw new Error(`ext_manage_issue_tags failed: ${e.message}`);
    }
  },
};
