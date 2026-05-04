import { apiDelete } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_tag',
  description:
    'Delete a tag from the YouTrack instance. This is destructive. The tag will be removed from all issues that have it. Cannot be undone.',
  inputSchema: {
    type: 'object',
    properties: {
      tagId: { type: 'string', description: 'ID of the tag to delete' },
    },
    required: ['tagId'],
  },
  annotations: {
    title: 'Delete tag',
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
      if (!ctx.tagId) throw new Error('tagId parameter is required');

      apiDelete(ctx, `/tags/${ctx.tagId}`);

      return {
        success: true,
      };
    } catch (e: any) {
      throw new Error(`ext_delete_tag failed: ${e.message}`);
    }
  },
};
