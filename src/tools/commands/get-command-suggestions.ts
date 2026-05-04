import { apiGet, apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_command_suggestions',
  description: 'Get suggestions for YouTrack commands. This tool assists in autocompleting and validating YouTrack commands. It returns matching suggestions with prefix/suffix formatting.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Partial command string to get suggestions for. Example: "State In Pro"',
      },
      issueId: {
        type: 'string',
        description: 'Optional: ID of an issue to provide context for command suggestions.',
      },
      caret: {
        type: 'number',
        description: 'Optional: Position in the query string where the cursor is located.',
      },
    },
    required: ['query'],
  },
  annotations: {
    title: 'Get Command Suggestions',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            prefix: { type: 'string' },
            option: { type: 'string' },
            suffix: { type: 'string' },
            description: { type: 'string' },
            matchingStart: { type: 'number' },
            matchingEnd: { type: 'number' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.query) {
        throw new Error('Missing required parameter: query');
      }

      const body: any = {
        query: ctx.query,
      };
      if (ctx.issueId !== undefined) {
        const issueData = apiGet(ctx, `/issues/${ctx.issueId}`, { fields: 'id' });
        body.issues = [{ $type: 'Issue', id: (issueData as any).id }];
      }
      body.caret = ctx.caret !== undefined ? ctx.caret : ctx.query.length;

      const result = apiPost(ctx, '/commands/assist', body, {
        fields: 'suggestions(option,description,prefix,suffix,matchingStart,matchingEnd)',
      }) || {};

      return {
        suggestions: result.suggestions || [],
      };
    } catch (e: any) {
      throw new Error(`ext_get_command_suggestions failed: ${e.message}`);
    }
  },
};
