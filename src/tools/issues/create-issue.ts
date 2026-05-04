import { apiPost, apiGet } from '../../lib/api-client';
import { projectCustomFields, ISSUE_CUSTOM_FIELDS_PROJECTION } from '../../lib/issue-fields';

exports.aiTool = {
  name: 'create_issue',
  description:
    'Create a new issue in a YouTrack project. Returns the created issue ID and summary. Optionally assign it to a user or set a type. For more complex field values use apply_command after creation.',
  inputSchema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Issue summary / title',
      },
      projectId: {
        type: 'string',
        description: 'Project short name (e.g., "DEMO")',
      },
      description: {
        type: 'string',
        description: 'Issue description (supports Markdown)',
      },
      assigneeLogin: {
        type: 'string',
        description: 'Login of the user to assign the issue to',
      },
      type: {
        type: 'string',
        description: 'Issue type name (e.g., "Bug", "Feature", "Task")',
      },
    },
    required: ['summary', 'projectId'],
  },
  annotations: {
    title: 'Create issue',
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
      summary: { type: 'string' },
      description: { type: 'string' },
      type: { type: ['object', 'null'] },
      assignee: { type: ['object', 'null'] },
      priority: { type: ['object', 'null'] },
      state: { type: ['object', 'null'] },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.summary) throw new Error('summary is required');
      if (!ctx.projectId) throw new Error('projectId is required');

      // Resolve project shortName to internal ID. Query directly by shortName
      // to avoid fetching all projects (which can be slow on large instances).
      const projects = apiGet(ctx, '/admin/projects', {
        fields: 'id,shortName',
        query: ctx.projectId,
        top: 50,
      });
      const project = (projects as any[]).find((p: any) => p.shortName === ctx.projectId);
      if (!project) {
        throw new Error(`Project not found: "${ctx.projectId}". Make sure it is a valid project shortName (e.g., "DEMO").`);
      }

      const body: Record<string, any> = {
        summary: ctx.summary,
        project: { id: project.id },
      };
      if (ctx.description !== undefined) {
        body.description = ctx.description;
      }
      const data = apiPost(ctx, '/issues', body, {
        fields: 'id,idReadable,summary,description',
      });

      // Type and Assignee are custom fields in YouTrack; setting them via the
      // /issues body shape is unreliable across instances. Use /commands which
      // routes through YouTrack's command parser and works for any custom-field
      // configuration.
      const commandParts: string[] = [];
      if (ctx.type) commandParts.push(`Type ${ctx.type}`);
      if (ctx.assigneeLogin) commandParts.push(`for ${ctx.assigneeLogin}`);
      if (commandParts.length > 0) {
        apiPost(ctx, '/commands', {
          query: commandParts.join(' '),
          issues: [{ idReadable: data.idReadable }],
          silent: true,
        });
      }

      // After possible command-driven mutations, re-read the issue so the
      // caller gets back the actual applied state (assignee, type, default
      // priority/state) rather than just what the initial POST returned.
      let projected = { priority: null, state: null, type: null, assignee: null } as any;
      let finalSummary = data.summary;
      let finalDescription = data.description ?? '';
      if (commandParts.length > 0) {
        const fresh: any = apiGet(ctx, `/issues/${data.idReadable}`, {
          fields: `summary,description,${ISSUE_CUSTOM_FIELDS_PROJECTION}`,
        });
        projected = projectCustomFields(fresh.customFields);
        if (typeof fresh.summary === 'string') finalSummary = fresh.summary;
        if (typeof fresh.description === 'string') finalDescription = fresh.description;
      }

      return {
        id: data.id,
        idReadable: data.idReadable,
        summary: finalSummary,
        description: finalDescription,
        type: projected.type,
        assignee: projected.assignee,
        priority: projected.priority,
        state: projected.state,
      };
    } catch (e: any) {
      throw new Error(`ext_create_issue failed: ${e.message}`);
    }
  },
};
