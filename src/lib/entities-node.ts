/**
 * Node.js stub for @jetbrains/youtrack-scripting-api/entities
 *
 * Tools that use the entities API (Issue.findById, etc.) cannot run in the
 * npm MCP server because the entities API only works inside the YouTrack runtime.
 * These tools will return a clear error message when called via the npm server.
 */

function notSupported(apiName: string) {
  return new Proxy({}, {
    get(_target, prop) {
      if (typeof prop === 'string') {
        return () => {
          throw new Error(
            `entities.${apiName}.${prop}() is not available in the npm MCP server mode. ` +
            `This tool uses the YouTrack Scripting API which is not supported here. ` +
            `Use the REST API endpoints via apiGet/apiPost instead.`
          );
        };
      }
      return undefined;
    },
  });
}

exports.Issue = notSupported('Issue');
exports.Project = notSupported('Project');
exports.User = notSupported('User');
exports.Tag = notSupported('Tag');
exports.Sprint = notSupported('Sprint');
exports.AgileBoard = notSupported('AgileBoard');
exports.IssueComment = notSupported('IssueComment');
exports.WorkItem = notSupported('WorkItem');
