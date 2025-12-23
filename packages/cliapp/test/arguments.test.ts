/**
 * @file Unit tests for command arguments functionality
 */

import * as CliApp from '@epdoc/cliapp';
import { assertEquals, assertExists } from '@std/assert';

Deno.test('Arguments - Required argument', () => {
  const definition: CliApp.Declarative.CommandDefinition = {
    name: 'test',
    description: 'Test command',
    arguments: [
      { name: 'file', description: 'Input file', required: true },
    ],
    action: (_ctx, args, _opts) => {
      assertEquals(args.length, 1);
      assertEquals(args[0], 'test.txt');
      return Promise.resolve();
    },
  };

  const cmd = new CliApp.Declarative.Command(definition);
  assertExists(cmd);
  assertEquals(cmd.definition.arguments?.length, 1);
  assertEquals(cmd.definition.arguments?.[0]?.name, 'file');
});

Deno.test('Arguments - Optional argument', () => {
  const definition: CliApp.Declarative.CommandDefinition = {
    name: 'test',
    description: 'Test command',
    arguments: [
      { name: 'file', description: 'Input file', required: false },
    ],
    action: (_ctx, _args, _opts) => {
      // Args can be empty for optional arguments
      return Promise.resolve();
    },
  };

  const cmd = new CliApp.Declarative.Command(definition);
  assertExists(cmd);
  assertEquals(cmd.definition.arguments?.length, 1);
  assertEquals(cmd.definition.arguments?.[0]?.required, false);
});

Deno.test('Arguments - Variadic argument', () => {
  const definition: CliApp.Declarative.CommandDefinition = {
    name: 'test',
    description: 'Test command',
    arguments: [
      { name: 'files', description: 'Input files', variadic: true },
    ],
    action: (_ctx, args, _opts) => {
      // Can handle multiple files
      assertExists(args);
      return Promise.resolve();
    },
  };

  const cmd = new CliApp.Declarative.Command(definition);
  assertExists(cmd);
  assertEquals(cmd.definition.arguments?.length, 1);
  assertEquals(cmd.definition.arguments?.[0]?.variadic, true);
});

Deno.test('Arguments - Multiple arguments', () => {
  const definition: CliApp.Declarative.CommandDefinition = {
    name: 'test',
    description: 'Test command',
    arguments: [
      { name: 'input', description: 'Input file', required: true },
      { name: 'output', description: 'Output file', required: false },
    ],
    action: (_ctx, args, _opts) => {
      assertExists(args);
      return Promise.resolve();
    },
  };

  const cmd = new CliApp.Declarative.Command(definition);
  assertExists(cmd);
  assertEquals(cmd.definition.arguments?.length, 2);
});

Deno.test('Arguments - Root command with arguments', () => {
  const definition: CliApp.Declarative.RootCommandDefinition = {
    name: 'test',
    description: 'Test root command',
    arguments: [
      { name: 'command', description: 'Command to run' },
    ],
    action: (_ctx, args, _opts) => {
      assertExists(args);
      return Promise.resolve();
    },
  };

  const rootCmd = new CliApp.Declarative.RootCommand(definition);
  assertExists(rootCmd);
  assertEquals(rootCmd.definition.arguments?.length, 1);
});
