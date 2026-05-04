import { apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'get_issue_activities',
  description: 'Retrieve the activity history of an issue showing all changes, comments, and events. Includes activity type, timestamp, author, field changes (added/removed values). Useful for auditing issue changes and understanding issue lifecycle.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable ID of the issue (e.g., "DEMO-123") or internal issue ID.',
      },
      categories: {
        type: 'string',
        description: 'Comma-separated activity categories to retrieve. Options: CommentsCategory, IssueCreatedCategory, SummaryCategory, WorkItemCategory, ProjectCategory, AttachmentsCategory, LinksCategory, IssueResolvedCategory, TagsCategory, VcsChangeCategory, SprintCategory. Omit to get all categories.',
      },
      top: {
        type: 'number',
        description: 'Maximum number of activities to return. Default is 50.',
        default: 50,
      },
      skip: {
        type: 'number',
        description: 'Number of activities to skip (for pagination). Default is 0.',
        default: 0,
      },
      reverse: {
        type: 'boolean',
        description: 'If true, return activities in reverse chronological order. Default is false.',
        default: false,
      },
    },
    required: ['issueId'],
  },
  annotations: {
    title: 'Get Issue Activities',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      activities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            timestamp: { type: 'number' },
            author: {
              type: 'object',
              properties: {
                login: { type: 'string' },
                name: { type: 'string' },
              },
            },
            field: {
              type: 'string',
              description: 'Name of the field that changed (e.g., "State", "Assignee"). Empty when activity is not field-scoped.',
            },
            added: {
              type: 'array',
              description: 'Values that were added in this activity. Strings or simple objects depending on the field type.',
              items: {},
            },
            removed: {
              type: 'array',
              description: 'Values that were removed in this activity.',
              items: {},
            },
          },
        },
      },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) {
        throw new Error('issueId is required');
      }

      const top = ctx.top ?? 50;
      const skip = ctx.skip ?? 0;
      const reverse = ctx.reverse ?? false;

      const options: any = {
        fields: 'id,$type,timestamp,author(login,name),field(name,presentation),added(name,presentation,login,text),removed(name,presentation,login,text)',
        top,
        skip,
      };

      // YouTrack silently returns an empty list for unknown categories instead
      // of erroring. Validate up-front so the caller gets a clear message.
      const KNOWN_CATEGORIES = [
        'CommentsCategory',
        'AttachmentsCategory',
        'IssueResolvedCategory',
        'LinksCategory',
        'ProjectCategory',
        'TagsCategory',
        'IssueCreatedCategory',
        'CustomFieldCategory',
        'DescriptionCategory',
        'SummaryCategory',
        'WorkItemCategory',
        'VcsChangeCategory',
        'SprintCategory',
      ];
      const DEFAULT_CATEGORIES = 'CommentsCategory,AttachmentsCategory,IssueResolvedCategory,LinksCategory,ProjectCategory,TagsCategory,IssueCreatedCategory,CustomFieldCategory,DescriptionCategory,SummaryCategory';
      const requested: string = ctx.categories || DEFAULT_CATEGORIES;
      const requestedList = requested.split(',').map((c) => c.trim()).filter(Boolean);
      const unknown = requestedList.filter((c) => !KNOWN_CATEGORIES.includes(c));
      if (unknown.length > 0) {
        throw new Error(
          `Unknown activity categor${unknown.length > 1 ? 'ies' : 'y'}: ${unknown.join(', ')}. Valid categories: ${KNOWN_CATEGORIES.join(', ')}.`
        );
      }
      options.categories = requestedList.join(',');
      if (reverse) {
        options.reverse = 'true';
      }

      // keepTypes: this tool maps `$type` (e.g. "CommentActivityItem") into
       // the output `type` field, so it must opt out of the api-client strip.
      const activitiesData = apiGet(ctx, `/issues/${ctx.issueId}/activities`, options, true);
      const list = Array.isArray(activitiesData) ? activitiesData : [];

      const flattenValue = (v: any): any => {
        if (v === null || v === undefined) return null;
        if (typeof v !== 'object') return v;
        return v.presentation || v.name || v.text || v.login || null;
      };
      const toArray = (v: any): any[] => {
        if (Array.isArray(v)) return v.map(flattenValue).filter((x) => x !== null);
        if (v === null || v === undefined) return [];
        const f = flattenValue(v);
        return f === null ? [] : [f];
      };

      return {
        activities: list.map((a: any) => ({
          id: a.id,
          type: a.$type || a.type || '',
          timestamp: a.timestamp ?? null,
          author: a.author ? { login: a.author.login, name: a.author.name } : null,
          field: a.field?.presentation || a.field?.name || '',
          added: toArray(a.added),
          removed: toArray(a.removed),
        })),
      };
    } catch (e: any) {
      throw new Error(`ext_get_issue_activities failed: ${e.message}`);
    }
  },
};
