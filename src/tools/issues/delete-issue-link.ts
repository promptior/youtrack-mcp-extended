import { apiDelete, apiGet } from '../../lib/api-client';

exports.aiTool = {
  name: 'delete_issue_link',
  description:
    'Removes a link between two issues in YouTrack. The link must exist before it can be deleted. Returns success confirmation.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'ID of the source issue (e.g., "DEMO-123")',
      },
      linkId: {
        type: 'string',
        description: 'ID of the link group (from get_issue_links, e.g., "167-0")',
      },
      linkedIssueId: {
        type: 'string',
        description: 'ID of the target issue to unlink (e.g., "DEMO-456")',
      },
    },
    required: ['issueId', 'linkId', 'linkedIssueId'],
  },
  annotations: {
    title: 'Delete Issue Link',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the link was successfully deleted',
      },
    },
    required: ['success'],
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId || typeof ctx.issueId !== 'string') {
        throw new Error('issueId is required and must be a string');
      }
      if (!ctx.linkId || typeof ctx.linkId !== 'string') {
        throw new Error('linkId is required and must be a string');
      }
      if (!ctx.linkedIssueId || typeof ctx.linkedIssueId !== 'string') {
        throw new Error('linkedIssueId is required and must be a string');
      }

      // Resolve linkedIssueId readable ID to internal ID
      const linkedIssue = apiGet(ctx, `/issues/${ctx.linkedIssueId}`, { fields: 'id' });
      apiDelete(ctx, `/issues/${ctx.issueId}/links/${ctx.linkId}/issues/${(linkedIssue as any).id}`);

      return {
        success: true,
      };
    } catch (e: any) {
      throw new Error(`ext_delete_issue_link failed: ${e.message}`);
    }
  },
};
