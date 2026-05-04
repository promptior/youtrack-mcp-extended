import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_issue_link_types',
  description:
    'Retrieve all issue link types available in YouTrack. Shows how issues can be linked together (relates to, blocks, duplicates, etc.). Useful before creating issue links.',
  inputSchema: {
    type: 'object',
    properties: {
      top: { type: 'number', description: 'Maximum number of link types to return (default 50)' },
    },
    required: [],
  },
  annotations: {
    title: 'Get issue link types',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      linkTypes: { type: 'array' },
    },
  },
  execute: (ctx: any) => {
    try {
      const fields = 'id,name,sourceToTarget,targetToSource,directed';
      const top = ctx.top || 50;

      const data = apiGet(ctx, '/issueLinkTypes', { fields, top });
      const list = Array.isArray(data) ? data : [];

      return {
        linkTypes: list.map((lt: any) => ({
          id: lt.id,
          name: lt.name,
          sourceToTarget: lt.sourceToTarget,
          targetToSource: lt.targetToSource,
          directed: lt.directed || false,
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_get_issue_link_types failed: ${e.message}`);
    }
  },
};
