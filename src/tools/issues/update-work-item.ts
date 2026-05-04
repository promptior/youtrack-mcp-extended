import { apiGet, apiPost } from '../../lib/api-client';

function resolveWorkTypeId(ctx: any, name: string): string {
  const types = apiGet(ctx, '/admin/timeTrackingSettings/workItemTypes', {
    fields: 'id,name',
  }) as any[];
  const list = Array.isArray(types) ? types : [];
  const match = list.find((t: any) => t && t.name === name);
  if (!match) {
    const known = list.map((t: any) => t.name).filter(Boolean).join(', ') || '(none)';
    throw new Error(`Unknown workType "${name}". Available: ${known}`);
  }
  return match.id;
}

exports.aiTool = {
  name: 'update_timetracking_work_item',
  description: 'Update an existing time-tracking work item on an issue. Can change duration, description, date, or work type.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'Issue ID (e.g. "DEMO-123")' },
      workItemId: { type: 'string', description: 'Work item ID to update' },
      duration: { type: 'number', description: 'Duration in minutes' },
      description: { type: 'string', description: 'Work item description' },
      date: { type: 'number', description: 'Date as Unix timestamp in milliseconds' },
      workType: { type: 'string', description: 'Work type name (e.g. "Development", "Testing")' },
    },
    required: ['issueId', 'workItemId'],
  },
  annotations: {
    title: 'Update timetracking work item',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      duration: { type: 'number' },
      description: { type: 'string' },
      date: { type: 'number' },
      type: { type: ['object', 'null'], description: 'Resolved work type as { name } or null.' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId is required');
      if (!ctx.workItemId) throw new Error('workItemId is required');

      const body: any = {};
      if (ctx.duration !== undefined) body.duration = { minutes: ctx.duration };
      if (ctx.description !== undefined) body.text = ctx.description;
      if (ctx.date !== undefined) body.date = ctx.date;
      if (ctx.workType !== undefined) body.type = { id: resolveWorkTypeId(ctx, ctx.workType) };

      const result = apiPost(ctx, `/issues/${ctx.issueId}/timeTracking/workItems/${ctx.workItemId}`, body, {
        fields: 'id,date,duration(minutes),text,type(name)',
      });

      return {
        id: result.id,
        duration: result.duration ? result.duration.minutes : undefined,
        description: result.text,
        date: result.date,
        type: result.type?.name ? { name: result.type.name } : null,
      };
    } catch (e: any) {
      throw new Error(`ext_update_timetracking_work_item failed: ${e.message}`);
    }
  },
};
