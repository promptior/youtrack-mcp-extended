import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_comment_reaction',
  description:
    'Removes a reaction from an issue comment in YouTrack. The reaction must have been added previously. Returns success confirmation.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'ID of the issue containing the comment (e.g., "DEMO-123")',
      },
      commentId: {
        type: 'string',
        description: 'ID of the comment',
      },
      reactionId: {
        type: 'string',
        description: 'ID of the reaction to delete',
      },
    },
    required: ['issueId', 'commentId', 'reactionId'],
  },
  annotations: {
    title: 'Delete Comment Reaction',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the reaction was successfully deleted',
      },
    },
    required: ['success'],
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId || typeof ctx.issueId !== 'string') {
        throw new Error('issueId is required and must be a string');
      }
      if (!ctx.commentId || typeof ctx.commentId !== 'string') {
        throw new Error('commentId is required and must be a string');
      }
      if (!ctx.reactionId || typeof ctx.reactionId !== 'string') {
        throw new Error('reactionId is required and must be a string');
      }

      apiDelete(ctx, 
        `/issues/${ctx.issueId}/comments/${ctx.commentId}/reactions/${ctx.reactionId}`
      );

      return {
        success: true,
      };
    } catch (e: any) {
      throw new Error(`ext_delete_comment_reaction failed: ${e.message}`);
    }
  },
};
