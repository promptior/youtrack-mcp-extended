import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_issue_work_items',
  description: 'Retrieve all time tracking work items (time logs) associated with a specific issue. Returns duration in minutes, date worked, author, work type, and description. Useful for viewing time spent and work tracking history.',
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
    title: 'Get Issue Work Items',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      workItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            date: { type: 'number' },
            duration: { type: 'number' },
            author: {
              type: 'object',
              properties: {
                login: { type: 'string' },
                name: { type: 'string' },
              },
            },
            type: { type: ['object', 'null'], description: 'Work type as { name } or null when no type is set.' },
            description: { type: 'string' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId is required');

      const items = apiGet(ctx, `/issues/${ctx.issueId}/timeTracking/workItems`, {
        fields: 'id,date,duration(minutes),text,author(login,name),type(name)',
      });

      const workItems = (items as any[]).map((item: any) => ({
        id: item.id,
        date: item.date,
        duration: item.duration?.minutes ?? 0,
        description: item.text || '',
        author: {
          login: item.author?.login ?? '',
          name: item.author?.name ?? '',
        },
        // Match get_all_work_items shape: object with name, or null.
        type: item.type?.name ? { name: item.type.name } : null,
      }));

      return { workItems };
    } catch (e: any) {
      throw new Error(`ext_get_issue_work_items failed: ${e.message}`);
    }
  },
};
