import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'search_articles',
  description: 'Search knowledge base articles using a query string. Returns articles with summary, content preview, author, project, tags, and timestamps. Useful for finding relevant documentation and knowledge base content.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find matching articles.',
      },
      projectId: {
        type: 'string',
        description: 'Optional filter to limit search to a specific project.',
      },
      top: {
        type: 'number',
        description: 'Maximum number of articles to return. Default is 20.',
        default: 20,
      },
      skip: {
        type: 'number',
        description: 'Number of articles to skip (for pagination). Default is 0.',
        default: 0,
      },
    },
    required: [],
  },
  annotations: {
    title: 'Search Articles',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      articles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            idReadable: { type: 'string' },
            summary: { type: 'string' },
            content: { type: 'string' },
            created: { type: 'number' },
            updated: { type: 'number' },
            author: {
              type: 'object',
              properties: {
                login: { type: 'string' },
                name: { type: 'string' },
              },
            },
            project: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      const top = ctx.top ?? 20;
      const skip = ctx.skip ?? 0;

      const options: any = {
        fields: 'id,idReadable,summary,content,created,updated,author(login,name),project(id,name),tags(name),parentArticle(id,idReadable)',
        top,
        skip,
      };

      const queryParts: string[] = [];
      if (ctx.projectId) {
        // YouTrack's `project:` query operator requires a shortName, not the
        // numeric internal id. If the caller passed something that looks like
        // an internal id (e.g. "0-0") resolve it to the shortName first;
        // otherwise pass it through unchanged.
        let projectQueryValue: string = ctx.projectId;
        if (/^\d+-\d+$/.test(String(ctx.projectId))) {
          try {
            const proj: any = apiGet(ctx, `/admin/projects/${ctx.projectId}`, { fields: 'shortName' });
            if (proj && typeof proj.shortName === 'string' && proj.shortName.length > 0) {
              projectQueryValue = proj.shortName;
            }
          } catch (e: any) {
            throw new Error(
              `Could not resolve projectId "${ctx.projectId}" to a shortName: ${e.message}. Pass the project shortName (e.g. "DEMO") instead.`
            );
          }
        }
        queryParts.push(`project: ${projectQueryValue}`);
      }
      if (ctx.query) {
        queryParts.push(ctx.query);
      }
      if (queryParts.length > 0) {
        options.query = queryParts.join(' ');
      }

      const articlesData = apiGet(ctx, '/articles', options);

      const articles = (Array.isArray(articlesData) ? articlesData : []).map((a: any) => ({
        ...a,
        content: a.content && a.content.length > 500 ? a.content.substring(0, 500) + '...' : a.content,
      }));

      return {
        articles,
      };
    } catch (e: any) {
      throw new Error(`ext_search_articles failed: ${e.message}`);
    }
  },
};
