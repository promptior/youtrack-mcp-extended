#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ALL_TOOLS, AiTool } from './tools-registry';

export interface BaseCtx {
  settings: {
    youtrackBaseUrl: string;
    apiToken: string;
  };
}

export function buildListToolsResponse(tools: AiTool[]) {
  return {
    tools: tools.map(tool => {
      const out: Record<string, unknown> = {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      };
      if (tool.annotations) out.annotations = tool.annotations;
      if (tool.outputSchema) out.outputSchema = tool.outputSchema;
      return out;
    }),
  };
}

export function executeToolCall(
  tools: AiTool[],
  baseCtx: BaseCtx,
  name: string,
  args: Record<string, unknown> | undefined
) {
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  try {
    // Spread baseCtx LAST so a caller cannot override ctx.settings
    // (which carries the YouTrack URL + API token) via args.
    const ctx = { ...(args || {}), ...baseCtx };
    const result = tool.execute(ctx);

    const response: Record<string, unknown> = {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
    // Per MCP spec (2025-06-18), when the tool declares an outputSchema,
    // also expose the typed result as structuredContent so clients can validate.
    if (tool.outputSchema && result && typeof result === 'object') {
      response.structuredContent = result;
    }
    return response;
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

export async function main() {
  const YOUTRACK_URL = process.env.YOUTRACK_URL;
  const YOUTRACK_TOKEN = process.env.YOUTRACK_TOKEN;

  if (!YOUTRACK_URL || !YOUTRACK_TOKEN) {
    process.stderr.write(
      'Error: YOUTRACK_URL and YOUTRACK_TOKEN environment variables are required\n' +
      'Usage: YOUTRACK_URL=https://mycompany.youtrack.cloud YOUTRACK_TOKEN=perm:xxx npx @promtior/youtrack-mcp-extended\n'
    );
    process.exit(1);
  }

  const baseCtx: BaseCtx = {
    settings: {
      youtrackBaseUrl: YOUTRACK_URL,
      apiToken: YOUTRACK_TOKEN,
    },
  };

  process.stderr.write(`YouTrack Extended MCP: ${ALL_TOOLS.length} tools loaded\n`);

  const server = new Server(
    {
      name: 'youtrack-mcp-extended',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return buildListToolsResponse(ALL_TOOLS);
  });

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;
    return executeToolCall(ALL_TOOLS, baseCtx, name, args);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('YouTrack Extended MCP server running on stdio\n');
}

