import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'create_sprint',
  description: 'Create a new sprint within an Agile board. Requires the board ID and sprint name. Optionally include a goal, start date, and finish date for the sprint.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'ID of the Agile board where the sprint will be created.',
      },
      name: {
        type: 'string',
        description: 'Name of the new sprint. Example: "Sprint 1"',
      },
      goal: {
        type: 'string',
        description: 'Sprint goal or objective (optional).',
      },
      startDate: {
        type: 'number',
        description: 'Sprint start date as Unix timestamp in milliseconds (optional).',
      },
      finishDate: {
        type: 'number',
        description: 'Sprint finish date as Unix timestamp in milliseconds (optional).',
      },
    },
    required: ['boardId', 'name'],
  },
  annotations: {
    title: 'Create Sprint',
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
      name: { type: 'string' },
      goal: { type: 'string' },
      start: { type: 'number' },
      finish: { type: 'number' },
      isCompleted: { type: 'boolean' },
      archived: { type: 'boolean' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.boardId || !ctx.name) {
        throw new Error('Missing required parameters: boardId and name are required');
      }

      const body: any = {
        name: ctx.name,
      };
      if (ctx.goal !== undefined) body.goal = ctx.goal;
      if (ctx.startDate !== undefined) body.start = ctx.startDate;
      if (ctx.finishDate !== undefined) body.finish = ctx.finishDate;

      // Without fields= YouTrack only returns {id,$type}; we'd then report
      // start/finish as null even though the values were stored correctly.
      const result = apiPost(ctx, `/agiles/${ctx.boardId}/sprints`, body, {
        fields: 'id,name,goal,start,finish,isCompleted,archived',
      });

      return {
        id: result.id,
        name: result.name ?? '',
        goal: result.goal ?? '',
        start: result.start ?? null,
        finish: result.finish ?? null,
        isCompleted: result.isCompleted ?? false,
        archived: result.archived ?? false,
      };
    } catch (e: any) {
      throw new Error(`ext_create_sprint failed: ${e.message}`);
    }
  },
};
