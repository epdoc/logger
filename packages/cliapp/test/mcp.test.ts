/**
 * @file Tests for MCP server integration
 * @description Verifies command tree introspection and tool definition generation
 */

import * as assert from 'node:assert';
import * as Commander from 'commander';
import { extractToolDefinitions } from '../src/mcp/introspect.ts';

Deno.test('MCP introspection', async (t) => {
  await t.step('extractToolDefinitions', async (t) => {
    await t.step('should extract a single leaf command as one tool', () => {
      const root = new Commander.Command('myapp');
      root.description('My app');

      const sub = new Commander.Command('greet');
      sub.description('Greet someone');
      sub.option('--name <name>', 'Name to greet');
      sub.argument('<message>', 'Greeting message');
      root.addCommand(sub);

      const tools = extractToolDefinitions(root);

      assert.strictEqual(tools.length, 1);
      assert.strictEqual(tools[0].name, 'myapp_greet');
      assert.strictEqual(tools[0].description, 'Greet someone');
      assert.ok(tools[0].inputSchema.properties['name']);
      assert.strictEqual(tools[0].inputSchema.properties['name'].type, 'string');
      assert.ok(tools[0].inputSchema.properties['message']);
      assert.strictEqual(tools[0].inputSchema.properties['message'].type, 'string');
      assert.ok(tools[0].inputSchema.required?.includes('message'));
      assert.deepStrictEqual(tools[0].argumentNames, ['message']);
    });

    await t.step('should extract multiple subcommands', () => {
      const root = new Commander.Command('app');

      const list = new Commander.Command('list');
      list.description('List items');
      root.addCommand(list);

      const add = new Commander.Command('add');
      add.description('Add an item');
      add.argument('<item>', 'Item to add');
      root.addCommand(add);

      const tools = extractToolDefinitions(root);

      assert.strictEqual(tools.length, 2);
      const names = tools.map((t) => t.name);
      assert.ok(names.includes('app_list'));
      assert.ok(names.includes('app_add'));
    });

    await t.step('should handle nested subcommands', () => {
      const root = new Commander.Command('hassio');

      const light = new Commander.Command('light');
      root.addCommand(light);

      const turnOn = new Commander.Command('turn-on');
      turnOn.description('Turn on a light');
      turnOn.argument('<device>', 'Device name');
      turnOn.option('--brightness <level>', 'Brightness level');
      light.addCommand(turnOn);

      const turnOff = new Commander.Command('turn-off');
      turnOff.description('Turn off a light');
      turnOff.argument('<device>', 'Device name');
      light.addCommand(turnOff);

      const tools = extractToolDefinitions(root);

      assert.strictEqual(tools.length, 2);
      const names = tools.map((t) => t.name);
      assert.ok(names.includes('hassio_light_turn-on'));
      assert.ok(names.includes('hassio_light_turn-off'));

      const onTool = tools.find((t) => t.name === 'hassio_light_turn-on')!;
      assert.ok(onTool.inputSchema.properties['device']);
      assert.ok(onTool.inputSchema.properties['brightness']);
      assert.ok(onTool.inputSchema.required?.includes('device'));
      assert.deepStrictEqual(onTool.argumentNames, ['device']);
    });

    await t.step('should skip logging options', () => {
      const root = new Commander.Command('myapp');

      const cmd = new Commander.Command('run');
      cmd.description('Run something');
      cmd.option('--log-level <level>', 'Log level');
      cmd.option('-D, --debug', 'Debug mode');
      cmd.option('--verbose', 'Verbose output');
      cmd.option('--user <name>', 'User name');
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      assert.strictEqual(tools.length, 1);
      const props = tools[0].inputSchema.properties;
      // Logging options should be excluded
      assert.strictEqual(props['logLevel'], undefined);
      assert.strictEqual(props['debug'], undefined);
      assert.strictEqual(props['verbose'], undefined);
      // Real option should be present
      assert.ok(props['user']);
    });

    await t.step('should handle boolean options', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('process');
      cmd.description('Process data');
      cmd.option('--force', 'Force processing');
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      assert.strictEqual(tools[0].inputSchema.properties['force'].type, 'boolean');
    });

    await t.step('should handle choices on options', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('format');
      cmd.description('Format output');
      cmd.option('--type <type>', 'Output type');
      // Set choices on the option
      const opt = cmd.options[0];
      opt.choices(['json', 'yaml', 'table']);
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      assert.deepStrictEqual(tools[0].inputSchema.properties['type'].enum, ['json', 'yaml', 'table']);
    });

    await t.step('should handle variadic arguments', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('files');
      cmd.description('Process files');
      cmd.argument('<files...>', 'Files to process');
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      const prop = tools[0].inputSchema.properties['files'];
      assert.strictEqual(prop.type, 'array');
      assert.deepStrictEqual(prop.items, { type: 'string' });
      assert.ok(tools[0].inputSchema.required?.includes('files'));
      assert.deepStrictEqual(tools[0].argumentNames, ['files']);
    });

    await t.step('should handle argument choices', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('query');
      cmd.description('Query servers');
      const arg = new Commander.Argument('<server>', 'Server to query');
      arg.choices(['alpha', 'beta', 'gamma']);
      cmd.addArgument(arg);
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      assert.deepStrictEqual(tools[0].inputSchema.properties['server'].enum, ['alpha', 'beta', 'gamma']);
    });

    await t.step('should skip hidden options', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('run');
      cmd.description('Run');
      const opt = new Commander.Option('--internal <val>', 'Internal option');
      opt.hideHelp();
      cmd.addOption(opt);
      cmd.option('--visible <val>', 'Visible option');
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      assert.strictEqual(tools[0].inputSchema.properties['internal'], undefined);
      assert.ok(tools[0].inputSchema.properties['visible']);
    });
  });
});
