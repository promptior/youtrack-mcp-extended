import { apiGet } from '../../lib/api-client';
import { projectCustomFields, ISSUE_CUSTOM_FIELDS_PROJECTION } from '../../lib/issue-fields';

exports.aiTool = {
  name: 'get_issue',
  description:
    'Get full details of a specific YouTrack issue by its ID. Returns summary, description, state, priority, type, assignee, reporter, project, tags, and all custom fields. Use this when you know the issue ID and need complete information about it.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'Issue ID (e.g., "DEMO-123" or internal ID like "2-42")',
      },
    },
    required: ['issueId'],
  },
  annotations: {
    title: 'Get issue',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
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
      type: { type: 'object' },
      assignee: { type: 'object' },
      reporter: { type: 'object' },
      project: { type: 'object' },
      tags: { type: 'array' },
      customFields: { type: 'array' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId is required');
      const data: any = apiGet(ctx, `/issues/${ctx.issueId}`, {
        fields:
          `id,idReadable,summary,description,created,updated,resolved,reporter(login,name),project(id,name,shortName),tags(name),${ISSUE_CUSTOM_FIELDS_PROJECTION}`,
      });
      const projected = projectCustomFields(data.customFields);
      return {
        id: data.id,
        idReadable: data.idReadable,
        summary: data.summary,
        description: data.description,
        created: data.created,
        updated: data.updated,
        resolved: data.resolved,
        priority: projected.priority,
        state: projected.state,
        type: projected.type,
        assignee: projected.assignee,
        reporter: data.reporter,
        project: data.project,
        tags: data.tags,
        customFields: data.customFields,
      };
    } catch (e: any) {
      throw new Error(`ext_get_issue failed: ${e.message}`);
    }
  },
};
