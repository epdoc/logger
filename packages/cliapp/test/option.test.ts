import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists } from '@std/assert';
import * as _ from '@epdoc/type';
import { Command } from '../src/command.ts';
import { FluentOptionBuilder } from '../src/option.ts';
import pkg from '../deno.json' with { type: 'json' };

describe('FluentOptionBuilder', () => {
  it('should create fluent option with choices and default', () => {
    const cmd = new Command(pkg);

    const result = cmd
      .opt('--format <type>', 'Output format')
      .choices(['json', 'yaml', 'table'])
      .default('table')
      .done();

    assertEquals(result, cmd);

    // Verify option was added by checking help text contains the option
    const helpText = cmd.helpInformation();
    assertEquals(helpText.includes('--format <type>'), true);
    assertEquals(helpText.includes('Output format'), true);
  });

  it('should create fluent option with argParser and default', () => {
    const cmd = new Command(pkg);

    const result = cmd
      .opt('-l --lines [num]', 'Number of lines')
      .default(10)
      .argParser(_.asInt)
      .done();

    assertEquals(result, cmd);

    // Verify option was added
    const helpText = cmd.helpInformation();
    assertEquals(helpText.includes('-l --lines [num]'), true);
    assertEquals(helpText.includes('Number of lines'), true);
  });

  it('should support method chaining for multiple options', () => {
    const cmd = new Command(pkg);

    const result = cmd
      .opt('--format <type>', 'Output format')
      .choices(['json', 'yaml'])
      .default('json')
      .done()
      .opt('-v --verbose', 'Verbose output')
      .default(false)
      .done();

    assertEquals(result, cmd);

    const helpText = cmd.helpInformation();
    assertEquals(helpText.includes('--format <type>'), true);
    assertEquals(helpText.includes('-v --verbose'), true);
  });

  it('should support all fluent methods', () => {
    const cmd = new Command(pkg);

    const result = cmd
      .opt('--token <token>', 'API token')
      .env('API_TOKEN')
      .required()
      .done()
      .opt('--debug', 'Debug mode')
      .conflicts(['quiet'])
      .hideHelp()
      .done();

    assertEquals(result, cmd);
  });

  it('should work with fluentOption alias', () => {
    const cmd = new Command(pkg);

    const result = cmd
      .fluentOption('--test <value>', 'Test option')
      .default('test')
      .done();

    assertEquals(result, cmd);

    const helpText = cmd.helpInformation();
    assertEquals(helpText.includes('--test <value>'), true);
  });

  it('should return FluentOptionBuilder instance', () => {
    const cmd = new Command(pkg);

    const builder = cmd.opt('--test', 'Test option');

    assertExists(builder);
    assertEquals(builder instanceof FluentOptionBuilder, true);
    assertEquals(typeof builder.choices, 'function');
    assertEquals(typeof builder.default, 'function');
    assertEquals(typeof builder.done, 'function');
  });
});
