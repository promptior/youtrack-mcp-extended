import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'update_agile_board',
  description: 'Update an existing Agile board. Can update the board name and sprint settings. Provide the board ID and the fields to update.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'ID of the board to update.',
      },
      name: {
        type: 'string',
        description: 'New name for the board (optional).',
      },
      sprintsEnabled: {
        type: 'boolean',
        description: 'Enable or disable sprints for this board (optional). WARNING: setting this to false destroys all existing sprints on the board; re-enabling resets the board to a single empty "First sprint". Use with care.',
      },
    },
    required: ['boardId'],
  },
  annotations: {
    title: 'Update Agile Board',
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
      sprintsEnabled: { type: 'boolean' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.boardId) {
        throw new Error('Missing required parameter: boardId');
      }

      const body: any = {};
      if (ctx.name !== undefined) body.name = ctx.name;
      if (ctx.sprintsEnabled !== undefined) {
        body.sprintsSettings = { disableSprints: !ctx.sprintsEnabled };
      }

      const result = apiPost(ctx, `/agiles/${ctx.boardId}`, body, {
        fields: 'id,name,sprintsSettings(disableSprints)',
      });

      return {
        id: result.id,
        name: result.name,
        sprintsEnabled: result.sprintsSettings ? !result.sprintsSettings.disableSprints : false,
      };
    } catch (e: any) {
      throw new Error(`ext_update_agile_board failed: ${e.message}`);
    }
  },
};
