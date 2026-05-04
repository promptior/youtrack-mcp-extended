import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_issue_vcs_changes',
  description:
    'Retrieve all VCS (Version Control System) changes linked to an issue. Shows commits, branches, and code changes associated with the issue. Useful for understanding what code changes address a specific issue.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'ID or key of the issue (e.g., "DEMO-123")' },
    },
    required: ['issueId'],
  },
  annotations: {
    title: 'Get issue VCS changes',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      vcsChanges: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            date: { type: 'number' },
            version: { type: 'string' },
            author: { type: 'object', properties: { login: { type: 'string' }, name: { type: 'string' } } },
            urls: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, url: { type: 'string' }, webUrl: { type: 'string' } } } },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId parameter is required');

      const fields = 'id,text,date,fetched,version,author(login,name),processors(type,url,webUrl)';
      const data = apiGet(ctx, `/issues/${ctx.issueId}/vcsChanges`, { fields });
      const list = Array.isArray(data) ? data : [];

      return {
        vcsChanges: list.map((change: any) => ({
          id: change.id,
          text: change.text || '',
          date: change.date || null,
          version: change.version || '',
          author: change.author ? { login: change.author.login, name: change.author.name } : null,
          urls: (change.processors || []).map((p: any) => ({
            type: p.type,
            url: p.url,
            webUrl: p.webUrl,
          })),
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_get_issue_vcs_changes failed: ${e.message}`);
    }
  },
};
