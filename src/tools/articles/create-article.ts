import { apiPost, apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'create_article',
  description: 'Create a new Knowledge Base article. Requires a summary (title), content, and project ID. Optionally can specify a parent article to create a sub-article.',
  inputSchema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Title of the article.',
      },
      content: {
        type: 'string',
        description: 'Content of the article (supports markdown).',
      },
      projectId: {
        type: 'string',
        description: 'ID of the project where the article will be created.',
      },
      parentArticleId: {
        type: 'string',
        description: 'ID of the parent article if this is a sub-article (optional).',
      },
    },
    required: ['summary', 'content', 'projectId'],
  },
  annotations: {
    title: 'Create Article',
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
      content: { type: 'string' },
      project: { type: ['object', 'null'] },
      parentArticle: { type: ['object', 'null'] },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.summary || !ctx.content || !ctx.projectId) {
        throw new Error('Missing required parameters: summary, content, and projectId are required');
      }

      // Resolve project shortName/id to internal ID
      let project: any;
      try {
        project = apiGet(ctx, `/admin/projects/${ctx.projectId}`, { fields: 'id,shortName' });
      } catch (_) {
        project = null;
      }
      if (!project || !project.id) {
        throw new Error(`Project not found: "${ctx.projectId}". Make sure it is a valid project shortName (e.g., "DEMO") or internal ID.`);
      }

      const body: any = {
        summary: ctx.summary,
        content: ctx.content,
        project: {
          id: project.id,
        },
      };
      if (ctx.parentArticleId !== undefined) {
        body.parentArticle = {
          id: ctx.parentArticleId,
        };
      }

      const result = apiPost(ctx, '/articles', body, {
        fields: 'id,idReadable,summary,content,project(id,name,shortName),parentArticle(id,idReadable)',
      });

      return {
        id: result.id,
        idReadable: result.idReadable ?? '',
        summary: result.summary ?? '',
        content: result.content ?? '',
        project: result.project ?? null,
        parentArticle: result.parentArticle ?? null,
      };
    } catch (e: any) {
      throw new Error(`ext_create_article failed: ${e.message}`);
    }
  },
};
