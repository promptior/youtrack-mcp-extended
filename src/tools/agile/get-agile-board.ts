import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_agile_board',
  description: 'Retrieve detailed information about a specific Agile board including its name, status, owner, associated projects, column settings, sprint settings, and estimation configuration.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'The unique identifier of the Agile board to retrieve.',
      },
    },
    required: ['boardId'],
  },
  annotations: {
    title: 'Get Agile Board',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      board: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              hasJobs: { type: 'boolean' },
              errors: { type: 'array', items: { type: 'string' } },
              warnings: { type: 'array', items: { type: 'string' } },
            },
          },
          owner: {
            type: 'object',
            properties: {
              login: { type: 'string' },
            },
          },
          projects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
          columnSettings: {
            type: 'object',
            properties: {
              field: { type: ['object', 'null'] },
              columns: { type: 'array' },
            },
          },
          sprintsSettings: {
            type: 'object',
            properties: {
              disableSprints: { type: 'boolean' },
              isExplicit: { type: 'boolean' },
              explicitQuery: { type: ['string', 'null'] },
              defaultSprint: { type: ['object', 'null'] },
              addNewIssueToKanban: { type: 'boolean' },
              cardOnSeveralSprints: { type: 'boolean' },
              sprintSyncField: { type: ['object', 'null'] },
            },
          },
          estimationField: { type: ['object', 'null'] },
          velocityType: { type: ['string', 'null'] },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.boardId) {
        throw new Error('boardId is required');
      }

      const fields = [
        'id',
        'name',
        'status(valid,hasJobs,errors,warnings)',
        'owner(login)',
        'projects(id,name)',
        'columnSettings(field(name),columns(presentation,fieldValues(name)))',
        'sprintsSettings(disableSprints,isExplicit,explicitQuery,addNewIssueToKanban,cardOnSeveralSprints,defaultSprint(id,name),sprintSyncField(name))',
        'estimationField(name)',
        'velocityType',
      ].join(',');

      const board = apiGet(ctx, `/agiles/${ctx.boardId}`, { fields });

      return {
        board,
      };
    } catch (e: any) {
      throw new Error(`ext_get_agile_board failed: ${e.message}`);
    }
  },
};
