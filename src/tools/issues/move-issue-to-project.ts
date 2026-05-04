import { apiPost, apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'move_issue_to_project',
  description:
    'Move an issue from one project to another. The issue ID will change to match the new project naming convention. Returns metadata about the move.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'ID or key of the issue to move (e.g., "OLD-123")' },
      targetProjectId: { type: 'string', description: 'ID of the target project' },
    },
    required: ['issueId', 'targetProjectId'],
  },
  annotations: {
    title: 'Move issue to project',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      moved: { type: 'boolean' },
      issueId: { type: 'string' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId parameter is required');
      if (!ctx.targetProjectId) throw new Error('targetProjectId parameter is required');

      // Resolve to internal ID first so the post-move lookup still works
      // (readable IDs like "OLD-123" become invalid after the move).
      const pre = apiGet(ctx, `/issues/${ctx.issueId}`, { fields: 'id' }) as any;
      const internalId = pre.id;

      apiPost(ctx, `/issues/${internalId}`, { project: { id: ctx.targetProjectId } });

      // Fetch the issue's new readable ID in the target project
      const updated = apiGet(ctx, `/issues/${internalId}`, { fields: 'id,idReadable' });

      return {
        moved: true,
        issueId: (updated as any).idReadable,
      };
    } catch (e: any) {
      // Surface YouTrack workflow runtime errors more usefully — these come
      // from server-side rules, not the MCP, so the caller needs to know it
      // is a YouTrack-side problem (and which rule fired).
      const msg: string = e.message || String(e);
      if (msg.includes('"error_workflow_type":"runtime"') || msg.includes('"error_workflow_type": "runtime"')) {
        const ruleMatch = msg.match(/"error_rule_name"\s*:\s*"([^"]+)"/);
        const ruleName = ruleMatch ? ruleMatch[1] : '(unknown rule)';
        throw new Error(
          `ext_move_issue_to_project failed: A YouTrack workflow rule rejected the move ` +
          `(rule "${ruleName}"). The issue was NOT moved. Disable or fix the workflow rule on the YouTrack server, ` +
          `then retry. Raw error: ${msg}`
        );
      }
      throw new Error(`ext_move_issue_to_project failed: ${msg}`);
    }
  },
};
