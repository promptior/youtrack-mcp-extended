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
  name: 'log_work',
  description: 'Log a work item (time entry) on an issue. Specify the duration in minutes and optionally a date, description, and work type. Useful for tracking time spent on tasks.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable ID of the issue (e.g., "DEMO-123") or internal issue ID.',
      },
      duration: {
        type: 'number',
        description: 'Duration of the work in minutes (e.g., 60 for 1 hour, 90 for 1h 30min).',
      },
      date: {
        type: 'number',
        description: 'Timestamp in milliseconds (Unix ms) for when the work was done. Defaults to the current time. Note: YouTrack stores work item dates at day-precision (00:00 UTC of the given day), so the time-of-day component is dropped server-side.',
      },
      description: {
        type: 'string',
        description: 'Optional description or note for the work item.',
      },
      workType: {
        type: 'string',
        description: 'Optional work type name (e.g., "Development", "Testing", "Documentation").',
      },
    },
    required: ['issueId', 'duration'],
  },
  annotations: {
    title: 'Log Work',
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
      date: { type: 'number' },
      duration: { type: 'number' },
      description: { type: 'string' },
      type: { type: ['object', 'null'], description: 'Resolved work type as { name } or null.' },
      author: {
        type: 'object',
        properties: {
          login: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) {
        throw new Error('issueId is required');
      }
      if (ctx.duration === undefined || ctx.duration === null) {
        throw new Error('duration is required');
      }

      const date = ctx.date ?? Date.now();

      const body: any = {
        date,
        duration: { minutes: ctx.duration },
      };

      if (ctx.description) {
        body.text = ctx.description;
      }
      if (ctx.workType) {
        body.type = { id: resolveWorkTypeId(ctx, ctx.workType) };
      }

      const result = apiPost(ctx, `/issues/${ctx.issueId}/timeTracking/workItems`, body, {
        fields: 'id,date,duration(minutes),text,author(login,name),type(name)',
      });

      return {
        id: result.id,
        date: result.date,
        duration: result.duration ? result.duration.minutes : ctx.duration,
        description: result.text || ctx.description || null,
        type: result.type?.name ? { name: result.type.name } : null,
        author: result.author || null,
      };
    } catch (e: any) {
      throw new Error(`ext_log_work failed: ${e.message}`);
    }
  },
};
