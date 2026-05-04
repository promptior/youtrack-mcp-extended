import { apiGet, apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'change_issue_assignee',
  description: 'Change the assignee of an issue. Pass the login of the user to assign, or an empty string to unassign the issue. Returns the updated issue with the new assignee information.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable ID of the issue (e.g., "DEMO-123") or internal issue ID.',
      },
      assigneeLogin: {
        type: 'string',
        description: 'Login of the user to assign to the issue. Pass an empty string "" to unassign.',
      },
    },
    required: ['issueId', 'assigneeLogin'],
  },
  annotations: {
    title: 'Change Issue Assignee',
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
      idReadable: { type: 'string' },
      assignee: {
        type: 'object',
        properties: {
          login: { type: 'string' },
          name: { type: 'string' },
        },
        nullable: true,
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) {
        throw new Error('issueId is required');
      }
      if (ctx.assigneeLogin === undefined || ctx.assigneeLogin === null) {
        throw new Error('assigneeLogin is required');
      }

      // Assignee is a custom field in YouTrack and POST /issues/{id} with a
      // top-level "assignee" attribute is silently ignored. Use the /commands
      // endpoint, which routes through YouTrack's command parser and works
      // regardless of the project's custom-field configuration.
      const command = ctx.assigneeLogin === '' ? 'Assignee Unassigned' : `for ${ctx.assigneeLogin}`;
      apiPost(ctx, '/commands', {
        query: command,
        issues: [{ idReadable: ctx.issueId }],
        silent: true,
      });

      const result = apiGet(ctx, `/issues/${ctx.issueId}`, {
        fields: 'id,idReadable,customFields(name,value(login,name))',
      });
      const assigneeField = (result.customFields || []).find((f: any) => f.name === 'Assignee');
      const assignee = assigneeField && assigneeField.value
        ? { login: assigneeField.value.login, name: assigneeField.value.name }
        : null;

      return {
        id: result.id,
        idReadable: result.idReadable,
        assignee,
      };
    } catch (e: any) {
      throw new Error(`ext_change_issue_assignee failed: ${e.message}`);
    }
  },
};
