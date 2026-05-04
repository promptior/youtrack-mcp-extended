import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_issue_link_type',
  description:
    'Updates an existing issue link type in YouTrack. Can modify the name and/or the source-to-target and target-to-source descriptions. Returns the updated link type details.',
  inputSchema: {
    type: 'object',
    properties: {
      linkTypeId: {
        type: 'string',
        description: 'ID of the issue link type to update',
      },
      name: {
        type: 'string',
        description: 'New name for the link type (optional)',
      },
      sourceToTarget: {
        type: 'string',
        description: 'New description of link from source to target (optional)',
      },
      targetToSource: {
        type: 'string',
        description: 'New description of link from target to source (optional)',
      },
    },
    required: ['linkTypeId'],
  },
  annotations: {
    title: 'Update Issue Link Type',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the updated link type',
      },
      name: {
        type: 'string',
        description: 'Updated name',
      },
      sourceToTarget: {
        type: 'string',
        description: 'Updated source-to-target description',
      },
      targetToSource: {
        type: 'string',
        description: 'Updated target-to-source description',
      },
    },
    required: ['id', 'name', 'sourceToTarget', 'targetToSource'],
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.linkTypeId || typeof ctx.linkTypeId !== 'string') {
        throw new Error('linkTypeId is required and must be a string');
      }

      const body: any = {};
      if (ctx.name !== undefined) {
        body.name = ctx.name;
      }
      if (ctx.sourceToTarget !== undefined) {
        body.sourceToTarget = ctx.sourceToTarget;
      }
      if (ctx.targetToSource !== undefined) {
        body.targetToSource = ctx.targetToSource;
      }

      const result = apiPost(ctx, `/issueLinkTypes/${ctx.linkTypeId}`, body, {
        fields: 'id,name,sourceToTarget,targetToSource',
      });

      return {
        id: result.id,
        name: result.name,
        sourceToTarget: result.sourceToTarget,
        targetToSource: result.targetToSource,
      };
    } catch (e: any) {
      throw new Error(`ext_update_issue_link_type failed: ${e.message}`);
    }
  },
};
