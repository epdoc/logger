import { assertEquals, assertStringIncludes } from '@std/assert';
import { ListCmd } from '../src/cmd/list.ts';
import { ProcessCmd } from '../src/cmd/process.ts';
import * as Ctx from '../src/context/mod.ts';

Deno.test('ListCmd - processes files correctly', async () => {
  const ctx = new Ctx.Context();
  await ctx.setupLogging();
  ctx.logMgr.threshold = 'error'; // Suppress logs in tests
  const listCmd = new ListCmd(ctx);

  // Test with mock files - should not throw
  await listCmd['executeAction'](['main.ts', 'deno.json'], { humanize: false, size: false });
});

Deno.test('ListCmd - handles empty file list', async () => {
  const ctx = new Ctx.Context();
  await ctx.setupLogging();
  ctx.logMgr.threshold = 'error'; // Suppress logs in tests
  const listCmd = new ListCmd(ctx);

  // Test with no files - should not throw
  await listCmd['executeAction']([], { humanize: false, size: false });
});

Deno.test('ListCmd - handles humanize option', async () => {
  const ctx = new Ctx.Context();
  await ctx.setupLogging();
  ctx.logMgr.threshold = 'error'; // Suppress logs in tests
  const listCmd = new ListCmd(ctx);

  // Test with humanize option - should not throw
  await listCmd['executeAction'](['deno.json'], { humanize: true, size: false });
});

Deno.test('ProcessCmd - executes without errors', async () => {
  const ctx = new Ctx.Context();
  await ctx.setupLogging();
  ctx.logMgr.threshold = 'error'; // Suppress logs in tests
  const processCmd = new ProcessCmd(ctx);

  // Test process command - should not throw
  await processCmd['executeAction']([], { more: false, name: 'test' });
});

Deno.test('Commands - can be initialized', async () => {
  const ctx = new Ctx.Context();
  await ctx.setupLogging();
  ctx.logMgr.threshold = 'error'; // Suppress logs in tests

  // Test that commands can be initialized without errors
  const listCmd = new ListCmd(ctx);
  const processCmd = new ProcessCmd(ctx);

  const listCommand = await listCmd.init();
  const processCommand = await processCmd.init();

  // Verify commands have correct names
  assertEquals(listCommand.name(), 'list');
  assertEquals(processCommand.name(), 'process');
});

Deno.test('Commands - have correct descriptions', async () => {
  const ctx = new Ctx.Context();
  await ctx.setupLogging();
  ctx.logMgr.threshold = 'error'; // Suppress logs in tests

  const listCmd = new ListCmd(ctx);
  const processCmd = new ProcessCmd(ctx);

  const listCommand = await listCmd.init();
  const processCommand = await processCmd.init();

  // Verify commands have descriptions containing "files"
  assertStringIncludes(listCommand.description(), 'files');
  assertStringIncludes(processCommand.description(), 'files');
});
