import { apiGet, apiPost } from '../../lib/api-client';

exports.aiTool = {
  name: 'link_issues',
  description: 'Create a link between two issues using a YouTrack command. The linkTypeName is the command verb used in YouTrack (e.g., "relates to", "depends on", "duplicates", "is required for", "subtask of"). Default is "relates to".',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable ID of the source issue (e.g., "DEMO-123").',
      },
      targetIssueId: {
        type: 'string',
        description: 'The readable ID of the target issue to link to (e.g., "DEMO-456").',
      },
      linkTypeName: {
        type: 'string',
        description: 'YouTrack command verb for the link type. Default: "relates to". Other examples: "depends on", "duplicates", "is required for", "subtask of", "parent for".',
        default: 'relates to',
      },
    },
    required: ['issueId', 'targetIssueId'],
  },
  annotations: {
    title: 'Link Issues',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      linked: { type: 'boolean' },
      created: { type: 'boolean', description: 'True if this call created the link; false if it already existed.' },
      issueId: { type: 'string' },
      targetIssueId: { type: 'string' },
      linkTypeName: { type: 'string' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId is required');
      if (!ctx.targetIssueId) throw new Error('targetIssueId is required');

      const linkTypeName = ctx.linkTypeName || 'relates to';

      // A bucket matches the requested verb when the verb equals either
       // sourceToTarget (for OUTWARD/BOTH links) or targetToSource (for INWARD)
       // — or simply the linkType.name as a forgiving fallback.
      // We MUST filter by the verb, otherwise asking with a bogus verb when
      // any *other* link already exists would lie back "linked: true".
      const matchesVerb = (group: any): boolean => {
        const lt = group?.linkType || {};
        const dir = group?.direction;
        if (lt.name === linkTypeName) return true;
        if ((dir === 'OUTWARD' || dir === 'BOTH') && lt.sourceToTarget === linkTypeName) return true;
        if ((dir === 'INWARD' || dir === 'BOTH') && lt.targetToSource === linkTypeName) return true;
        return false;
      };

      const linkExists = (): boolean => {
        const links = apiGet(ctx, `/issues/${ctx.issueId}/links`, {
          fields: 'direction,linkType(name,sourceToTarget,targetToSource),issues(idReadable)',
        });
        const list = Array.isArray(links) ? links : [];
        return list.some((group: any) =>
          matchesVerb(group) &&
          Array.isArray(group.issues) &&
          group.issues.some((i: any) => i && i.idReadable === ctx.targetIssueId)
        );
      };

      // Snapshot before so we can tell whether /commands actually created the link.
      const existedBefore = linkExists();
      if (existedBefore) {
        return {
          linked: true,
          created: false,
          issueId: ctx.issueId,
          targetIssueId: ctx.targetIssueId,
          linkTypeName,
        };
      }

      const body = {
        query: `${linkTypeName} ${ctx.targetIssueId}`,
        issues: [{ idReadable: ctx.issueId }],
      };
      apiPost(ctx, '/commands', body);

      // /commands returns 200 + empty body even when the verb is invalid.
      // Confirm the link actually exists by fetching the issue's link list.
      if (!linkExists()) {
        throw new Error(
          `Link command did not produce a link from ${ctx.issueId} to ${ctx.targetIssueId}. ` +
          `Verify the linkTypeName "${linkTypeName}" is a valid YouTrack command verb.`
        );
      }

      return {
        linked: true,
        created: true,
        issueId: ctx.issueId,
        targetIssueId: ctx.targetIssueId,
        linkTypeName,
      };
    } catch (e: any) {
      throw new Error(`ext_link_issues failed: ${e.message}`);
    }
  },
};
