import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'create_issue_link_type',
  description:
    'Creates a new issue link type in YouTrack. Link types define the relationships between issues (e.g., "duplicates", "related to", "blocked by"). Returns the created link type with ID and names.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the link type (e.g., "duplicates", "related to")',
      },
      sourceToTarget: {
        type: 'string',
        description: 'Description of the link from source to target issue (e.g., "duplicates")',
      },
      targetToSource: {
        type: 'string',
        description: 'Description of the link from target to source issue (e.g., "is duplicated by")',
      },
      directed: {
        type: 'boolean',
        description: 'Whether the link type is directional. Default: true',
      },
    },
    required: ['name', 'sourceToTarget', 'targetToSource'],
  },
  annotations: {
    title: 'Create Issue Link Type',
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
        description: 'Unique identifier of the created link type',
      },
      name: {
        type: 'string',
        description: 'Name of the link type',
      },
      sourceToTarget: {
        type: 'string',
        description: 'Description of the link from source to target',
      },
      targetToSource: {
        type: 'string',
        description: 'Description of the link from target to source',
      },
    },
    required: ['id', 'name', 'sourceToTarget', 'targetToSource'],
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.name || typeof ctx.name !== 'string') {
        throw new Error('name is required and must be a string');
      }
      if (!ctx.sourceToTarget || typeof ctx.sourceToTarget !== 'string') {
        throw new Error('sourceToTarget is required and must be a string');
      }
      if (!ctx.targetToSource || typeof ctx.targetToSource !== 'string') {
        throw new Error('targetToSource is required and must be a string');
      }

      const body = {
        name: ctx.name,
        sourceToTarget: ctx.sourceToTarget,
        targetToSource: ctx.targetToSource,
        directed: ctx.directed ?? true,
      };

      const result = apiPost(ctx, '/issueLinkTypes', body, {
        fields: 'id,name,sourceToTarget,targetToSource',
      });

      return {
        id: result.id,
        name: result.name,
        sourceToTarget: result.sourceToTarget,
        targetToSource: result.targetToSource,
      };
    } catch (e: any) {
      throw new Error(`ext_create_issue_link_type failed: ${e.message}`);
    }
  },
};
