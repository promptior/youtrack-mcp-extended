/**
 * Node.js stub for @jetbrains/youtrack-scripting-api/app
 *
 * In the npm MCP server, settings come from environment variables (YOUTRACK_URL,
 * YOUTRACK_TOKEN) and are passed via ctx, so app.getSettings() is not used.
 */

exports.getSettings = function () {
  throw new Error(
    'app.getSettings() is not available in the npm MCP server. ' +
    'Settings are provided via YOUTRACK_URL and YOUTRACK_TOKEN environment variables.'
  );
};
