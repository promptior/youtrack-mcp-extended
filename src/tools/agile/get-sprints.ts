import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_sprints',
  description: 'Retrieve a list of sprints for a specific Agile board. Includes sprint name, goal, start/finish dates, completion status, and archive status. Useful for planning and tracking sprint progress.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'The unique identifier of the Agile board.',
      },
      archived: {
        type: 'boolean',
        description: 'Filter sprints by archive status. Default is false (show active sprints).',
        default: false,
      },
      top: {
        type: 'number',
        description: 'Maximum number of sprints to return. Default is 20.',
        default: 20,
      },
      skip: {
        type: 'number',
        description: 'Number of sprints to skip (for pagination). Default is 0.',
        default: 0,
      },
    },
    required: ['boardId'],
  },
  annotations: {
    title: 'Get Sprints',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      sprints: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            goal: { type: 'string' },
            start: { type: 'number' },
            finish: { type: 'number' },
            isCompleted: { type: 'boolean' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.boardId) {
        throw new Error('boardId is required');
      }

      const top = ctx.top ?? 20;
      const skip = ctx.skip ?? 0;
      const archived = ctx.archived ?? false;

      const sprintsData = apiGet(ctx, `/agiles/${ctx.boardId}/sprints`, {
        fields: 'id,name,goal,start,finish,isCompleted,archived',
        archived: archived ? 'true' : 'false',
        top,
        skip,
      });

      const sprints = Array.isArray(sprintsData) ? sprintsData : [];

      return {
        sprints,
      };
    } catch (e: any) {
      throw new Error(`ext_get_sprints failed: ${e.message}`);
    }
  },
};
