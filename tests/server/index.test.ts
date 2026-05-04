import { buildListToolsResponse, executeToolCall, BaseCtx } from '../../src/server/index';
import type { AiTool } from '../../src/server/tools-registry';

const baseCtx: BaseCtx = {
  settings: {
    youtrackBaseUrl: 'https://test.youtrack.cloud',
    apiToken: 'real-token',
  },
};

describe('server: buildListToolsResponse', () => {
  it('exposes name, description, inputSchema for every tool', () => {
    const tools: AiTool[] = [
      {
        name: 'no_extras',
        description: 'minimal',
        inputSchema: { type: 'object', properties: {} },
        execute: () => null,
      },
    ];

    const out = buildListToolsResponse(tools);

    expect(out.tools).toHaveLength(1);
    expect(out.tools[0]).toEqual({
      name: 'no_extras',
      description: 'minimal',
      inputSchema: { type: 'object', properties: {} },
    });
  });

  it('exposes annotations when defined (so destructiveHint reaches the client)', () => {
    const tools: AiTool[] = [
      {
        name: 'delete_thing',
        description: 'destructive op',
        inputSchema: { type: 'object', properties: {} },
        annotations: {
          title: 'Delete thing',
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false,
        },
        execute: () => ({ success: true }),
      },
    ];

    const out = buildListToolsResponse(tools);

    expect(out.tools[0]).toMatchObject({
      annotations: expect.objectContaining({ destructiveHint: true }),
    });
  });

  it('exposes outputSchema when defined', () => {
    const tools: AiTool[] = [
      {
        name: 'with_schema',
        description: 'has output schema',
        inputSchema: { type: 'object', properties: {} },
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
        execute: () => ({ id: 'x' }),
      },
    ];

    const out = buildListToolsResponse(tools);

    expect(out.tools[0]).toMatchObject({
      outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
    });
  });

  it('omits annotations and outputSchema when undefined (no empty keys)', () => {
    const tools: AiTool[] = [
      {
        name: 'no_extras',
        description: 'd',
        inputSchema: { type: 'object', properties: {} },
        execute: () => null,
      },
    ];

    const out = buildListToolsResponse(tools);
    const t = out.tools[0] as Record<string, unknown>;
    expect('annotations' in t).toBe(false);
    expect('outputSchema' in t).toBe(false);
  });
});

describe('server: executeToolCall', () => {
  it('passes args to the tool and wraps result as text content', () => {
    const tools: AiTool[] = [
      {
        name: 'echo',
        description: 'returns input',
        inputSchema: { type: 'object', properties: {} },
        execute: (ctx: any) => ({ got: ctx.message }),
      },
    ];

    const result = executeToolCall(tools, baseCtx, 'echo', { message: 'hello' });

    expect(result.isError).toBeUndefined();
    expect(result.content).toEqual([
      { type: 'text', text: JSON.stringify({ got: 'hello' }, null, 2) },
    ]);
  });

  it('returns structuredContent when the tool declares an outputSchema', () => {
    const tools: AiTool[] = [
      {
        name: 'with_schema',
        description: 'd',
        inputSchema: { type: 'object', properties: {} },
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
        execute: () => ({ id: 'abc' }),
      },
    ];

    const result = executeToolCall(tools, baseCtx, 'with_schema', {});

    expect(result.structuredContent).toEqual({ id: 'abc' });
  });

  it('does NOT add structuredContent when the tool has no outputSchema', () => {
    const tools: AiTool[] = [
      {
        name: 'no_schema',
        description: 'd',
        inputSchema: { type: 'object', properties: {} },
        execute: () => ({ id: 'abc' }),
      },
    ];

    const result = executeToolCall(tools, baseCtx, 'no_schema', {});

    expect((result as Record<string, unknown>).structuredContent).toBeUndefined();
  });

  it('does NOT let the caller override settings via args (defense in depth)', () => {
    let observedSettings: unknown = null;
    const tools: AiTool[] = [
      {
        name: 'leak',
        description: 'd',
        inputSchema: { type: 'object', properties: {} },
        execute: (ctx: any) => {
          observedSettings = ctx.settings;
          return { ok: true };
        },
      },
    ];

    executeToolCall(tools, baseCtx, 'leak', {
      settings: { youtrackBaseUrl: 'https://attacker.example', apiToken: 'evil' },
    });

    expect(observedSettings).toEqual(baseCtx.settings);
  });

  it('returns isError:true when the tool throws (text content carries the message)', () => {
    const tools: AiTool[] = [
      {
        name: 'boom',
        description: 'd',
        inputSchema: { type: 'object', properties: {} },
        execute: () => {
          throw new Error('something went wrong');
        },
      },
    ];

    const result = executeToolCall(tools, baseCtx, 'boom', {});

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: 'text', text: 'Error: something went wrong' }]);
    expect((result as Record<string, unknown>).structuredContent).toBeUndefined();
  });

  it('throws when the requested tool is not registered', () => {
    expect(() => executeToolCall([], baseCtx, 'missing', {})).toThrow('Tool not found: missing');
  });

  it('handles undefined args gracefully', () => {
    const tools: AiTool[] = [
      {
        name: 'noargs',
        description: 'd',
        inputSchema: { type: 'object', properties: {} },
        execute: () => ({ ok: true }),
      },
    ];

    const result = executeToolCall(tools, baseCtx, 'noargs', undefined);
    expect(result.content).toEqual([{ type: 'text', text: JSON.stringify({ ok: true }, null, 2) }]);
  });
});
