import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_issue_fields_schema',
  description:
    'Get the custom fields schema for a YouTrack project. Returns all configured custom fields including their type, whether they are required, and the text shown when the field is empty. Useful for understanding what fields are available before creating or updating issues.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or shortName (e.g., "DEMO" or the internal ID)',
      },
    },
    required: ['projectId'],
  },
  annotations: {
    title: 'Get Issue Fields Schema',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      fields: {
        type: 'array',
        description: 'List of custom fields configured for the project',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            fieldType: { type: 'string' },
            isRequired: { type: 'boolean' },
            emptyFieldText: { type: 'string' },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.projectId) throw new Error('projectId is required');

      const data = apiGet(
        ctx,
        `/admin/projects/${encodeURIComponent(ctx.projectId)}/customFields`,
        {
          fields:
            'id,name,ordinal,isPublic,bundle(id,name),field(id,name,fieldType(id)),canBeEmpty,emptyFieldText',
        }
      );

      const fields = Array.isArray(data) ? data : [];

      return {
        fields: fields.map((f: any) => ({
          id: f.id,
          name: f.field?.name || f.name || null,
          fieldType: f.field && f.field.fieldType ? f.field.fieldType.id : null,
          isRequired: f.canBeEmpty === false,
          emptyFieldText: f.emptyFieldText || null,
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_get_issue_fields_schema failed: ${e.message}`);
    }
  },
};
