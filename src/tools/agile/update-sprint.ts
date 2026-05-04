import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_sprint',
  description: 'Update an existing sprint within an Agile board. Can update the sprint name, goal, dates, or completion status.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'ID of the Agile board containing the sprint.',
      },
      sprintId: {
        type: 'string',
        description: 'ID of the sprint to update.',
      },
      name: {
        type: 'string',
        description: 'New name for the sprint (optional).',
      },
      goal: {
        type: 'string',
        description: 'New goal or objective for the sprint (optional).',
      },
      isCompleted: {
        type: 'boolean',
        description: 'Mark sprint as completed or not (optional).',
      },
    },
    required: ['boardId', 'sprintId'],
  },
  annotations: {
    title: 'Update Sprint',
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
      isCompleted: { type: 'boolean' },
      archived: { type: 'boolean' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.boardId || !ctx.sprintId) {
        throw new Error('Missing required parameters: boardId and sprintId are required');
      }

      const body: any = {};
      if (ctx.name !== undefined) body.name = ctx.name;
      if (ctx.goal !== undefined) body.goal = ctx.goal;
      if (ctx.isCompleted !== undefined) body.isCompleted = ctx.isCompleted;

      const result = apiPost(ctx, `/agiles/${ctx.boardId}/sprints/${ctx.sprintId}`, body, {
        fields: 'id,name,goal,start,finish,isCompleted,archived',
      });

      // YouTrack silently ignores `isCompleted: true` in some scenarios (e.g.
      // sprints with no end date or boards where sprints are disabled). Rather
      // than telling the caller it worked when it didn't, surface the mismatch.
      if (
        ctx.isCompleted !== undefined &&
        Boolean(result.isCompleted) !== Boolean(ctx.isCompleted)
      ) {
        throw new Error(
          `YouTrack accepted the request but did not change isCompleted (still ${result.isCompleted}). ` +
          `This usually means the sprint cannot be completed in its current state ` +
          `(e.g. sprintsEnabled is false on the board, or the sprint has no finish date).`
        );
      }

      return {
        id: result.id,
        name: result.name ?? '',
        goal: result.goal ?? '',
        isCompleted: result.isCompleted ?? false,
        archived: result.archived ?? false,
      };
    } catch (e: any) {
      throw new Error(`ext_update_sprint failed: ${e.message}`);
    }
  },
};
