import { apiPost } from '../../lib/api-client';

const MAX_RETRIES = 8;

exports.aiTool = {
  name: 'get_issue_count',
  description:
    'Count issues matching a YouTrack query. Returns the total count without fetching issue details. Useful for quick stats on project workload or issue status.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'YouTrack query to count issues (e.g., "project = DEMO", "State = Open")' },
    },
    required: ['query'],
  },
  annotations: {
    title: 'Get issue count',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      count: { type: 'number' },
      query: { type: 'string' },
      calculating: {
        type: 'boolean',
        description: 'True if YouTrack is still calculating after the internal retry budget. Count will be -1 in that case; retry the call later.',
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.query) throw new Error('query parameter is required');

      // YouTrack returns count: -1 with a transient "still calculating" state on
      // larger queries. Each retry is itself a network round-trip, so the loop
      // doubles as both poll and inter-attempt delay.
      let data: any = null;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        data = apiPost(ctx, '/issuesGetter/count', { query: ctx.query }, { fields: 'count' });
        if (data && data.count !== -1) break;
      }

      const result: any = { count: data?.count ?? 0, query: ctx.query };
      if (data?.count === -1) result.calculating = true;
      return result;
    } catch (e: any) {
      throw new Error(`ext_get_issue_count failed: ${e.message}`);
    }
  },
};
