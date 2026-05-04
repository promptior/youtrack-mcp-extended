import { apiGet } from '../../lib/api-client';
import { projectCustomFields, ISSUE_CUSTOM_FIELDS_PROJECTION } from '../../lib/issue-fields';

exports.aiTool = {
  name: 'search_issues',
  description:
    'Search for issues using a YouTrack query. Returns a list of matching issues with their key fields. Use this to find issues by project, state, assignee, priority, text, or any combination via YouTrack query language.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'YouTrack query string (e.g., "project = DEMO State = Open", "assignee = me #unresolved")',
      },
      top: {
        type: 'number',
        description: 'Maximum number of issues to return (default: 10)',
      },
      skip: {
        type: 'number',
        description: 'Number of issues to skip for pagination (default: 0)',
      },
    },
    required: ['query'],
  },
  annotations: {
    title: 'Search issues',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            idReadable: { type: 'string' },
            summary: { type: 'string' },
            description: { type: 'string' },
            created: { type: 'number' },
            updated: { type: 'number' },
            resolved: { type: 'number' },
            priority: { type: 'object' },
            state: { type: 'object' },
            assignee: { type: 'object' },
            project: { type: 'object' },
            tags: { type: 'array' },
          },
        },
      },
      returnedCount: { type: 'number', description: 'Number of issues returned in this page (not the total matching the query).' },
      hasMore: { type: 'boolean', description: 'True if there are more issues beyond this page (top+1 sentinel).' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.query) throw new Error('query is required');
      const top = ctx.top !== undefined ? ctx.top : 10;
      const skip = ctx.skip !== undefined ? ctx.skip : 0;
      // Request top+1 so we can detect hasMore without an extra count call.
      const data = apiGet(ctx, '/issues', {
        fields:
          `id,idReadable,summary,description,created,updated,resolved,project(id,name,shortName),tags(name),${ISSUE_CUSTOM_FIELDS_PROJECTION}`,
        query: ctx.query,
        top: top + 1,
        skip,
      });
      const raw = Array.isArray(data) ? data : [];
      const hasMore = raw.length > top;
      const sliced = raw.slice(0, top);
      const issues = sliced.map((d: any) => {
        const projected = projectCustomFields(d.customFields);
        return {
          id: d.id,
          idReadable: d.idReadable,
          summary: d.summary,
          description: d.description,
          created: d.created,
          updated: d.updated,
          resolved: d.resolved,
          project: d.project,
          tags: d.tags,
          priority: projected.priority,
          state: projected.state,
          type: projected.type,
          assignee: projected.assignee,
        };
      });
      return {
        issues,
        returnedCount: issues.length,
        hasMore,
      };
    } catch (e: any) {
      throw new Error(`ext_search_issues failed: ${e.message}`);
    }
  },
};
