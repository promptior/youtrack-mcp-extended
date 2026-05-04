import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_issue',
  description:
    'Update the summary or description of an existing YouTrack issue. For updating state, priority, assignee, or other custom fields use apply_command instead, which supports natural language commands like "State In Progress" or "Priority Critical".',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'Issue ID (e.g., "DEMO-123" or internal ID like "2-42")',
      },
      summary: {
        type: 'string',
        description: 'New summary / title for the issue',
      },
      description: {
        type: 'string',
        description: 'New description for the issue (supports Markdown)',
      },
    },
    required: ['issueId'],
  },
  annotations: {
    title: 'Update issue',
    readOnlyHint: false,
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
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId is required');
      if (ctx.summary === undefined && ctx.description === undefined) {
        throw new Error('at least one of summary or description must be provided');
      }
      const body: Record<string, any> = {};
      if (ctx.summary !== undefined) {
        body.summary = ctx.summary;
      }
      if (ctx.description !== undefined) {
        body.description = ctx.description;
      }
      const data = apiPost(ctx, `/issues/${ctx.issueId}`, body, {
        fields: 'id,idReadable,summary,description',
      });
      return {
        id: data.id,
        idReadable: data.idReadable,
        summary: data.summary,
        description: data.description ?? '',
      };
    } catch (e: any) {
      throw new Error(`ext_update_issue failed: ${e.message}`);
    }
  },
};
