import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_all_work_items',
  description:
    'Retrieves all work items (time tracking entries) across the entire YouTrack instance. Supports filtering by date range and author. Useful for time tracking reports and analytics. Returns paginated results with optional hasMore flag.',
  inputSchema: {
    type: 'object',
    properties: {
      top: {
        type: 'number',
        description: 'Maximum number of work items to return. Default: 50, max: 100',
      },
      skip: {
        type: 'number',
        description: 'Number of work items to skip for pagination. Default: 0',
      },
      startDate: {
        type: 'number',
        description: 'Start date filter as Unix timestamp in milliseconds (optional)',
      },
      endDate: {
        type: 'number',
        description: 'End date filter as Unix timestamp in milliseconds (optional)',
      },
      authorLogin: {
        type: 'string',
        description: 'Filter work items by author login (optional)',
      },
    },
  },
  annotations: {
    title: 'Get All Work Items',
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
        description: 'Array of work item objects',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier of the work item',
            },
            date: {
              type: 'number',
              description: 'Date of the work item as Unix timestamp in milliseconds',
            },
            duration: {
              type: 'number',
              description: 'Duration of work in minutes',
            },
            author: {
              type: 'object',
              properties: {
                login: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
              },
            },
            issue: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                idReadable: {
                  type: 'string',
                },
                summary: {
                  type: 'string',
                },
              },
            },
            description: {
              type: 'string',
              description: 'Work item description or notes',
            },
            type: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      hasMore: {
        type: 'boolean',
        description: 'Whether there are more results available',
      },
    },
    required: ['workItems', 'hasMore'],
  },
  execute: (ctx: any) => {
    try {
      const top = ctx.top ?? 50;
      const skip = ctx.skip ?? 0;

      if (top < 1 || top > 100) {
        throw new Error('top must be between 1 and 100');
      }
      if (skip < 0) {
        throw new Error('skip must be >= 0');
      }

      const options: any = {
        fields: 'id,date,duration(minutes),author(login,name),creator(login,name),issue(id,idReadable,summary),text,type(name)',
        top: top + 1, // Request one extra to determine hasMore
        skip: skip,
      };

      if (ctx.startDate !== undefined && typeof ctx.startDate === 'number') {
        options.start = ctx.startDate;
      }
      if (ctx.endDate !== undefined && typeof ctx.endDate === 'number') {
        options.end = ctx.endDate;
      }
      if (ctx.authorLogin !== undefined && typeof ctx.authorLogin === 'string') {
        options.author = ctx.authorLogin;
      }

      const result = apiGet(ctx, '/workItems', options);

      const items = Array.isArray(result) ? result : [];
      const hasMore = items.length > top;
      const workItems = items.slice(0, top).map((item: any) => ({
        id: item.id,
        date: item.date,
        duration: item.duration?.minutes ?? 0,
        author: {
          login: item.author?.login || 'unknown',
          name: item.author?.name || '',
        },
        issue: {
          id: item.issue?.id || '',
          idReadable: item.issue?.idReadable || '',
          summary: item.issue?.summary || '',
        },
        description: item.text || '',
        type: {
          name: item.type?.name || 'Work Item',
        },
      }));

      return {
        workItems: workItems,
        hasMore: hasMore,
      };
    } catch (e: any) {
      throw new Error(`ext_get_all_work_items failed: ${e.message}`);
    }
  },
};
