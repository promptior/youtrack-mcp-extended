import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_sprint',
  description:
    'Retrieve detailed information about a specific sprint including goals, dates, status, and all associated issues. Useful for sprint planning and tracking.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: { type: 'string', description: 'ID of the Agile board containing the sprint' },
      sprintId: { type: 'string', description: 'ID of the sprint' },
    },
    required: ['boardId', 'sprintId'],
  },
  annotations: {
    title: 'Get sprint',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      sprint: { type: 'object' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.boardId) throw new Error('boardId parameter is required');
      if (!ctx.sprintId) throw new Error('sprintId parameter is required');

      const fields = 'id,name,goal,start,finish,isCompleted,archived,issues(id,idReadable,summary,fields(State))';

      const data = apiGet(ctx, `/agiles/${ctx.boardId}/sprints/${ctx.sprintId}`, { fields });

      return {
        sprint: {
          id: data.id,
          name: data.name,
          goal: data.goal || '',
          start: data.start || null,
          finish: data.finish || null,
          isCompleted: data.isCompleted || false,
          archived: data.archived || false,
          issues: (data.issues || []).map((i: any) => ({
            id: i.id,
            idReadable: i.idReadable,
            summary: i.summary,
            state: i.fields?.State || null,
          })),
        },
      };
    } catch (e: any) {
      throw new Error(`ext_get_sprint failed: ${e.message}`);
    }
  },
};
