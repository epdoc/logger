/**
 * @file Unit tests for cliapp declarative functionality
 */

import * as CliApp from '@epdoc/cliapp';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { assertEquals, assertExists } from '@std/assert';

const option = CliApp.Declarative.option;
type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

// Test context for declarative commands
// class TestContext implements CliApp.ICtx<MsgBuilder, Logger> {
//   log = { info: { text: () => ({ emit: () => {} }) } } as Logger;
//   logMgr = {} as any;
//   dryRun = false;
//   pkg = { name: 'test', version: '1.0.0', description: 'Test app' };
//   async close() {}
// }

Deno.test('Declarative API - Option creation and chaining', () => {
  // Test string option
  const stringOpt = new CliApp.Declarative.Option.String('--name <value>', 'Name option')
    .required()
    .default('test');

  assertExists(stringOpt);
  assertEquals(stringOpt.flags, '--name <value>');
  assertEquals(stringOpt.description, 'Name option');
  assertEquals(stringOpt.getDefault(), 'test');
  assertEquals(stringOpt.isRequired(), true);

  // Test number option
  const numberOpt = option.number('--count <n>', 'Count option')
    .default(42);

  assertExists(numberOpt);
  assertEquals(numberOpt.getDefault(), 42);

  // Test boolean option
  const boolOpt = option.boolean('--flag', 'Boolean flag');
  assertExists(boolOpt);

  // Test inverted boolean option
  const invertedOpt = option.boolean('--no-cache', 'Disable cache')
    .inverted();
  assertExists(invertedOpt);

  // Test choices
  const choiceOpt = option.string('--format <type>', 'Format')
    .choices(['json', 'csv', 'xml']);
  assertEquals(choiceOpt.getChoices(), ['json', 'csv', 'xml']);
});

Deno.test('Declarative API - Option types', () => {
  // Test all option types exist and can be created
  const stringOpt = option.string('--str <val>', 'String');
  const numberOpt = option.number('--num <n>', 'Number');
  const boolOpt = option.boolean('--bool', 'Boolean');
  const dateOpt = option.date('--date <d>', 'Date');
  const pathOpt = option.path('--path <p>', 'Path');
  const arrayOpt = option.array('--list <items>', 'Array');

  assertExists(stringOpt);
  assertExists(numberOpt);
  assertExists(boolOpt);
  assertExists(dateOpt);
  assertExists(pathOpt);
  assertExists(arrayOpt);

  // Test parsing
  assertEquals(stringOpt.parse('test'), 'test');
  assertEquals(numberOpt.parse('42'), 42);
  assertEquals(boolOpt.parse(''), true);
  assertExists(dateOpt.parse('2023-01-01'));
  assertEquals(pathOpt.parse('/tmp'), '/tmp');
  assertEquals(arrayOpt.parse('a,b,c'), ['a', 'b', 'c']);
});

Deno.test('Declarative API - Boolean inversion', () => {
  const regularBool = option.boolean('--enable', 'Enable feature');
  const invertedBool = option.boolean('--no-cache', 'Disable cache').inverted();

  // Regular boolean returns true when present
  assertEquals(regularBool.parse(''), true);

  // Inverted boolean returns false when present
  assertEquals(invertedBool.parse(''), false);
});

Deno.test('Declarative API - Functions exist', () => {
  // Test that the main declarative functions exist
  assertExists(CliApp.Declarative.defineCommand);
  assertExists(CliApp.Declarative.defineRootCommand);
  assertExists(CliApp.Declarative.createApp);
});
