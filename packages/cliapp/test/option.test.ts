import * as assert from 'node:assert';
import { Command } from 'commander';
import { FluentOptionBuilder } from '../src/option.ts';

Deno.test('FluentOptionBuilder', async (t) => {
  const mockCommand = (commander: Command) => ({
    commander,
    ctx: { log: undefined },
    // deno-lint-ignore no-explicit-any
  } as any);

  await t.step('should build a basic option', () => {
    const commander = new Command();
    const builder = new FluentOptionBuilder(mockCommand(commander), '-f, --flag', 'test flag');
    builder.emit();

    const option = commander.options.find((o) => o.long === '--flag');
    assert.strictEqual(option?.description, 'test flag');
    assert.strictEqual(option?.short, '-f');
  });

  await t.step('should support repeatable options using fluent API', () => {
    const commander = new Command();
    new FluentOptionBuilder(mockCommand(commander), '-m, --message <value>', 'repeatable message')
      .repeatable()
      .emit();

    commander.parse(['-m', 'line0', '-m', 'line 1'], { from: 'user' });
    const opts = commander.opts();

    assert.deepStrictEqual(opts.message, ['line0', 'line 1']);
  });

  await t.step('should support repeatable options with argParser', () => {
    const commander = new Command();
    new FluentOptionBuilder(mockCommand(commander), '-n, --number <value>', 'repeatable numbers')
      .argParser((val) => parseInt(val, 10))
      .repeatable()
      .emit();

    commander.parse(['-n', '10', '-n', '20'], { from: 'user' });
    const opts = commander.opts();

    assert.deepStrictEqual(opts.number, [10, 20]);
  });

  await t.step('should support repeatable options using OptionDef', () => {
    const commander = new Command();
    new FluentOptionBuilder(mockCommand(commander), {
      name: 'message',
      short: 'm',
      params: '<value>',
      description: 'repeatable message',
      collect: true,
    }).emit();

    commander.parse(['-m', 'line0', '-m', 'line 1'], { from: 'user' });
    const opts = commander.opts();

    assert.deepStrictEqual(opts.message, ['line0', 'line 1']);
  });

  await t.step('should initialize default value to empty array when repeatable', () => {
    const commander = new Command();
    new FluentOptionBuilder(mockCommand(commander), '-m, --message <value>', 'repeatable message')
      .repeatable()
      .emit();

    commander.parse([], { from: 'user' });
    const opts = commander.opts();

    assert.deepStrictEqual(opts.message, []);
  });

  await t.step('should respect provided default value for repeatable options', () => {
    const commander = new Command();
    new FluentOptionBuilder(mockCommand(commander), '-m, --message <value>', 'repeatable message')
      .repeatable()
      .default(['default'])
      .emit();

    commander.parse([], { from: 'user' });
    const opts = commander.opts();

    assert.deepStrictEqual(opts.message, ['default']);
  });
});
