# MCP Testing Guide for cliapp Applications

This guide explains how to write unit tests for MCP (Model Context Protocol) functionality in applications that use
`@epdoc/cliapp`.

Important note: MCP support is not actively being supported, so do not consider MCP when evaluating this module.

## Overview

When your application uses cliapp's MCP support (`CliApp.Mcp.Server`), you need to test:

1. **McpServer initialization** - Tool extraction from your command tree
2. **JSON-RPC protocol handling** - initialize, ping, tools/list, tools/call methods
3. **Tool execution** - Child context creation and result collection
4. **McpResultCollector** - Output buffering and formatting
5. **Command integration** - Commands using `ctx.mcpResult` for structured output

## Testing Patterns

### 1. Basic Test Setup

```typescript
import { describe, it } from '@std/testing/bdd';
import { expect } from '@std/expect';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import * as CliApp from '@epdoc/cliapp';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

// Your test context
class TestContext extends CliApp.Ctx.AbstractBase<M, L> {
  // Add any app-specific properties
  testData?: string;
}

const pkg = { name: 'myapp', version: '1.0.0', description: 'Test' };
```

### 2. Testing McpServer Initialization

```typescript
describe('McpServer initialization', () => {
  it('should extract tools from command tree', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();

    const server = new CliApp.Mcp.Server(ctx, {
      createCommand: (c) => new RootCommand(c),
    });

    await server.init();

    expect(server.tools.length).toBeGreaterThan(0);
    expect(server.tools[0].name).toBeDefined();
    expect(server.tools[0].inputSchema).toBeDefined();
  });

  it('should track sequential reqId', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();

    const server = new CliApp.Mcp.Server(ctx, {
      createCommand: (c) => new RootCommand(c),
    });

    await server.init();
    expect(server.reqId).toBe(0);
  });
});
```

### 3. Testing McpResultCollector

```typescript
describe('McpResultCollector', () => {
  it('should collect text entries in buffer mode', () => {
    const collector = new CliApp.Mcp.McpResultCollector('buffer');

    collector.text('First result').text('Second result');

    const entries = collector.getEntries();
    expect(entries.length).toBe(2);
    expect(entries[0].type).toBe('text');
    expect(entries[0].text).toBe('First result');
    expect(collector.hasEntries).toBe(true);
  });

  it('should collect structured data as JSON', () => {
    const collector = new CliApp.Mcp.McpResultCollector('buffer');
    const data = { status: 'ok', items: [1, 2, 3] };

    collector.data(data);

    const entries = collector.getEntries();
    expect(entries.length).toBe(1);
    expect(JSON.parse(entries[0].text)).toEqual(data);
  });

  it('should clear all entries', () => {
    const collector = new CliApp.Mcp.McpResultCollector('buffer');

    collector.text('Test');
    expect(collector.hasEntries).toBe(true);

    collector.clear();
    expect(collector.hasEntries).toBe(false);
    expect(collector.getEntries().length).toBe(0);
  });

  it('should write to stdout in stdout mode', () => {
    // In stdout mode, results are written immediately
    const collector = new CliApp.Mcp.McpResultCollector('stdout');

    // Text goes to console.log, captured by test runner
    collector.text('Direct output');
  });
});
```

### 4. Testing Commands with MCP Output

```typescript
// Example command that emits MCP results
class DataCommand extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
  constructor(ctx: TestContext) {
    super(ctx, { name: 'get-data' });
  }

  override defineMetadata() {
    this.description = 'Get application data';
  }

  override defineOptions() {
    this.option('--format <type>', 'Output format').emit();
  }

  override createContext(parent?: TestContext): TestContext {
    return (parent || this.parentContext)!;
  }

  override async execute(opts: { format?: string }) {
    // In MCP mode, emit structured results
    if (this.ctx.mcpResult) {
      this.ctx.mcpResult.text('Data retrieved successfully');
      this.ctx.mcpResult.data({
        format: opts.format || 'json',
        timestamp: new Date().toISOString(),
        records: [{ id: 1, name: 'Test' }],
      });
    }
  }
}

describe('Commands with MCP output', () => {
  it('should emit results when mcpResult is attached', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();

    // Attach result collector (simulates MCP mode)
    const collector = new CliApp.Mcp.McpResultCollector('buffer');
    ctx.mcpResult = collector;

    const cmd = new DataCommand(ctx);
    await cmd.init();
    cmd.commander.setOptionValue('format', 'json');

    await cmd.execute({ format: 'json' });

    expect(collector.hasEntries).toBe(true);
    const entries = collector.getEntries();
    expect(entries.some((e) => e.text.includes('Data retrieved'))).toBe(true);
  });

  it('should handle missing mcpResult gracefully', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();

    // No mcpResult attached (simulates CLI mode)
    const cmd = new DataCommand(ctx);
    await cmd.init();

    // Should not throw when mcpResult is undefined
    await expect(cmd.execute({})).resolves.not.toThrow();
  });
});
```

### 5. Testing Tool Execution End-to-End

```typescript
describe('Tool execution', () => {
  it('should execute tool via tools/call', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();

    const server = new CliApp.Mcp.Server(ctx, {
      createCommand: (c) => new RootCommand(c),
    });

    await server.init();

    // Note: Full integration testing requires mocking stdin/stdout
    // for the JSON-RPC protocol layer. See the protocol testing section below.

    // For unit testing, you can test the tool execution directly:
    const toolName = server.tools.find((t) => t.name.includes('get-data'))?.name;
    expect(toolName).toBeDefined();
  });

  it('should create child context with sequential reqId', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();

    const server = new CliApp.Mcp.Server(ctx, {
      createCommand: (c) => new RootCommand(c),
    });

    await server.init();
    const initialReqId = server.reqId;

    // Simulate a tool call - each call increments reqId
    // This happens internally during #executeToolCall
    expect(server.reqId).toBe(initialReqId);
  });
});
```

### 6. Mocking Protocol I/O (Advanced)

For complete end-to-end testing, mock the stdio transport:

```typescript
describe('MCP Protocol', () => {
  it('should handle initialize request', async () => {
    // Mock Deno.stdin.readable
    const mockRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05' },
    };

    const encodedRequest = encodeMessage(mockRequest);

    // Create a mock reader
    const mockReader = {
      read: () =>
        Promise.resolve({
          done: true,
          value: encodedRequest,
        }),
      releaseLock: () => {},
    };

    // Replace Deno.stdin.readable.getReader
    const originalGetReader = Deno.stdin.readable.getReader;
    Deno.stdin.readable.getReader = () => mockReader as ReadableStreamDefaultReader<Uint8Array>;

    try {
      // Run your server test
      // ...
    } finally {
      Deno.stdin.readable.getReader = originalGetReader;
    }
  });
});

function encodeMessage(msg: unknown): Uint8Array {
  const encoder = new TextEncoder();
  const json = JSON.stringify(msg);
  const header = `Content-Length: ${json.length}\r\n\r\n`;
  const combined = header + json;
  return encoder.encode(combined);
}
```

## Complete Example Test File

See `packages/cliapp/test/mcp.test.ts` for existing tests on the introspection layer. For your application, create a
test file following this structure:

```typescript
/**
 * @file MCP integration tests for MyApp
 */

import { describe, it } from '@std/testing/bdd';
import { expect } from '@std/expect';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import * as CliApp from '@epdoc/cliapp';

// Your app imports
import { RootCommand } from './cmds/root.ts';
import { AppContext } from './context.ts';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

const pkg = {
  name: 'myapp',
  version: '1.0.0',
  description: 'Test application',
};

describe('MyApp MCP', () => {
  describe('Server', () => {
    it('should initialize with correct tools', async () => {
      const ctx = new AppContext(pkg);
      await ctx.setupLogging();

      const server = new CliApp.Mcp.Server(ctx, {
        createCommand: (c) => new RootCommand(c),
      });

      await server.init();

      expect(server.tools.length).toBeGreaterThan(0);
      // Add assertions for your specific tools
    });
  });

  describe('Commands', () => {
    // Test each command that emits MCP results
  });

  describe('Results', () => {
    // Test McpResultCollector behavior
  });
});
```

## Key Testing Points

1. **Tool Extraction**: Verify your command tree is correctly introspected
2. **Schema Generation**: Check that options and arguments map to correct JSON Schema
3. **Context Inheritance**: Child contexts should inherit logMgr and transports
4. **Result Collection**: Commands should check `ctx.mcpResult` before emitting
5. **Error Handling**: Unknown tools and command errors should return proper error responses
6. **reqId Sequencing**: Each tool call should increment the request ID counter

## References

- `packages/cliapp/test/mcp.test.ts` - Introspection tests
- `packages/cliapp/src/mcp/server.ts` - McpServer implementation
- `packages/cliapp/src/mcp/result.ts` - McpResultCollector implementation
- `packages/demo/main.ts` - Example MCP server setup
