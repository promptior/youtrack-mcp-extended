import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'add_comment_reaction',
  description:
    'Adds a reaction (emoji) to an issue comment in YouTrack. Examples of reactions: "thumbs-up", "laugh", "heart", "confused". Returns the reaction ID and author.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'ID of the issue containing the comment (e.g., "DEMO-123")',
      },
      commentId: {
        type: 'string',
        description: 'ID of the comment to react to',
      },
      reaction: {
        type: 'string',
        description:
          'Reaction emoji name (e.g., "thumbs-up", "laugh", "heart", "confused", "rocket")',
      },
    },
    required: ['issueId', 'commentId', 'reaction'],
  },
  annotations: {
    title: 'Add Comment Reaction',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier of the reaction',
      },
      reaction: {
        type: 'string',
        description: 'The reaction emoji name',
      },
      author: {
        type: 'string',
        description: 'Login of the user who added the reaction',
      },
    },
    required: ['id', 'reaction', 'author'],
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId || typeof ctx.issueId !== 'string') {
        throw new Error('issueId is required and must be a string');
      }
      if (!ctx.commentId || typeof ctx.commentId !== 'string') {
        throw new Error('commentId is required and must be a string');
      }
      if (!ctx.reaction || typeof ctx.reaction !== 'string') {
        throw new Error('reaction is required and must be a string');
      }

      const body = {
        $type: 'Reaction',
        reaction: ctx.reaction,
      };

      const result = apiPost(ctx, `/issues/${ctx.issueId}/comments/${ctx.commentId}/reactions`, body, {
        fields: 'id,reaction,author(login)',
      });

      return {
        id: result.id,
        reaction: result.reaction,
        author: result.author?.login || 'unknown',
      };
    } catch (e: any) {
      throw new Error(`ext_add_comment_reaction failed: ${e.message}`);
    }
  },
};
