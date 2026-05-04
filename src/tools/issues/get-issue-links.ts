import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_issue_links',
  description: 'Retrieve all links (relationships) associated with a specific issue. Returns link types, direction (inbound/outbound), and the linked issue summaries. Useful for understanding issue dependencies and relationships.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable ID of the issue (e.g., "DEMO-123") or internal issue ID.',
      },
    },
    required: ['issueId'],
  },
  annotations: {
    title: 'Get Issue Links',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      links: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            direction: { type: 'string' },
            linkType: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                sourceToTarget: { type: 'string' },
                targetToSource: { type: 'string' },
              },
            },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  idReadable: { type: 'string' },
                  summary: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId is required');

      const result = apiGet(ctx, `/issues/${ctx.issueId}`, {
        fields: 'links(id,direction,linkType(name,sourceToTarget,targetToSource),issues(id,idReadable,summary))',
      });

      // YouTrack returns one bucket per (linkType × direction) even when no
      // issues are linked. Filter those out — the LLM only cares about real links.
      const allBuckets = Array.isArray(result.links) ? result.links : [];
      const nonEmpty = allBuckets.filter((g: any) => Array.isArray(g.issues) && g.issues.length > 0);
      return { links: nonEmpty };
    } catch (e: any) {
      throw new Error(`ext_get_issue_links failed: ${e.message}`);
    }
  },
};
