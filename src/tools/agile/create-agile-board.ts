import { apiPost, apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'create_agile_board',
  description: 'Create a new Agile board. Requires a name, list of project IDs to associate with the board, and the name of the column field to use for board columns (typically "State"). Returns the newly created board ID and name.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the new Agile board. Example: "Development Board"',
      },
      projectIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of project IDs to associate with this board. Example: ["DEMO", "PROJ"]',
      },
      columnFieldName: {
        type: 'string',
        description: 'Name of the field to use for board columns. Typically "State" or custom field name. Example: "State"',
      },
    },
    required: ['name', 'projectIds', 'columnFieldName'],
  },
  annotations: {
    title: 'Create Agile Board',
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
      projects: { type: 'array' },
      sprintsEnabled: { type: 'boolean' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.name || !ctx.projectIds || !ctx.columnFieldName) {
        throw new Error('Missing required parameters: name, projectIds, and columnFieldName are required');
      }

      // Resolve project shortNames to internal IDs
      const allProjects = apiGet(ctx, '/admin/projects', { fields: 'id,shortName' });
      const resolvedProjectIds = (ctx.projectIds as string[]).map((shortName: string) => {
        const project = (allProjects as any[]).find((p: any) => p.shortName === shortName || p.id === shortName);
        if (!project) throw new Error(`Project not found: "${shortName}". Make sure it is a valid project shortName.`);
        return project.id;
      });

      // Resolve column field name to CustomField ID using first project
      const customFields = apiGet(ctx, `/admin/projects/${resolvedProjectIds[0]}/customFields`, { fields: 'id,field(id,name)' });
      const fieldEntry = (customFields as any[]).find((f: any) => f.field?.name === ctx.columnFieldName);
      if (!fieldEntry) {
        throw new Error(`Field "${ctx.columnFieldName}" not found in project "${ctx.projectIds[0]}". Check available fields via get_issue_fields_schema.`);
      }

      const body = {
        name: ctx.name,
        projects: resolvedProjectIds.map((id: string) => ({ id })),
        columnSettings: {
          field: { id: fieldEntry.field.id },
        },
      };

      const result = apiPost(ctx, '/agiles', body, {
        fields: 'id,name,projects(id,name,shortName),sprintsSettings(disableSprints)',
      });

      return {
        id: result.id,
        name: result.name ?? '',
        projects: Array.isArray(result.projects) ? result.projects : [],
        sprintsEnabled: !(result.sprintsSettings?.disableSprints === true),
      };
    } catch (e: any) {
      throw new Error(`ext_create_agile_board failed: ${e.message}`);
    }
  },
};
