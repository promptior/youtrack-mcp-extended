import { apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'apply_command',
  description:
    'Apply a bulk command to multiple issues. Allows updating any field using YouTrack command syntax (e.g., "State Fixed", "Priority {Critical}", "assignee user@company.com"). Extremely powerful for batch operations. Example: apply_command with issueIds=["DEMO-1","DEMO-2"], command="State Done assignee me" will mark both issues as Done and assign them to current user.',
  inputSchema: {
    type: 'object',
    properties: {
      issueIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of issue IDs (e.g., ["DEMO-1", "DEMO-2"])',
      },
      command: { type: 'string', description: 'YouTrack command (e.g., "State Fixed", "Priority Critical", "add tag urgent")' },
      comment: { type: 'string', description: 'Optional comment to add when applying command' },
      silent: { type: 'boolean', description: 'If true, do not notify users (default false)' },
    },
    required: ['issueIds', 'command'],
  },
  annotations: {
    title: 'Apply bulk command',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      applied: { type: 'boolean' },
      issueCount: { type: 'number' },
      command: { type: 'string' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueIds || ctx.issueIds.length === 0) throw new Error('issueIds array is required and must not be empty');
      if (!ctx.command) throw new Error('command parameter is required');

      const issues = ctx.issueIds.map((id: string) => ({ idReadable: id }));
      const body: any = {
        query: ctx.command,
        issues,
        silent: ctx.silent || false,
      };

      if (ctx.comment) body.comment = ctx.comment;

      const result = apiPost(ctx, '/commands', body);

      // Detectar errores que YouTrack puede devolver con HTTP 200
      if (result && typeof result === 'object') {
        if (result.error) {
          throw new Error(result.error_description || result.error);
        }
        if (Array.isArray(result.errors) && result.errors.length > 0) {
          const msg = result.errors.map((e: any) => e.message || JSON.stringify(e)).join('; ');
          throw new Error(`Command errors: ${msg}`);
        }
        if (Array.isArray(result.violations) && result.violations.length > 0) {
          const msg = result.violations.map((v: any) => v.message || JSON.stringify(v)).join('; ');
          throw new Error(`Command violations: ${msg}`);
        }
      }

      return {
        applied: true,
        issueCount: ctx.issueIds.length,
        command: ctx.command,
      };
    } catch (e: any) {
      throw new Error(`ext_apply_command failed: ${e.message}`);
    }
  },
};
