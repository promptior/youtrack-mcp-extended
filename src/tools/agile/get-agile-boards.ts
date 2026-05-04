import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_agile_boards',
  description: 'Retrieve a list of all Agile boards with their basic information including name, status, associated projects, and column settings. Useful for discovering available Agile boards and their configuration.',
  inputSchema: {
    type: 'object',
    properties: {
      top: {
        type: 'number',
        description: 'Maximum number of boards to return. Default is 50.',
        default: 50,
      },
      skip: {
        type: 'number',
        description: 'Number of boards to skip (for pagination). Default is 0.',
        default: 0,
      },
    },
    required: [],
  },
  annotations: {
    title: 'Get Agile Boards',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      boards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                errors: { type: 'array', items: { type: 'string' } },
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
              },
            },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      const top = ctx.top ?? 50;
      const skip = ctx.skip ?? 0;

      const boards = apiGet(ctx, '/agiles', {
        fields: 'id,name,status(valid,errors),projects(id,name),columnSettings(field(name))',
        top,
        skip,
      });

      return {
        boards: Array.isArray(boards) ? boards : [],
      };
    } catch (e: any) {
      throw new Error(`ext_get_agile_boards failed: ${e.message}`);
    }
  },
};
