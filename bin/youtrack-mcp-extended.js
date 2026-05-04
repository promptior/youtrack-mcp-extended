#!/usr/bin/env node
const { existsSync } = require('fs');
const { join } = require('path');

const distPath = join(__dirname, '..', 'dist', 'server', 'index.js');

if (!existsSync(distPath)) {
  process.stderr.write(
    'youtrack-mcp-extended: dist/server/index.js not found.\n' +
    'If installed from npm this should never happen — please file an issue at\n' +
    '  https://github.com/promptior/youtrack-mcp-extended/issues\n' +
    'If running from source, run `npm run build` first.\n'
  );
  process.exit(1);
}

require(distPath).main().catch(err => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
