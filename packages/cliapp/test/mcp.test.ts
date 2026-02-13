/**
 * @file Tests for MCP server integration
 * @description Verifies command tree introspection and tool definition generation
 */

import { describe, it } from '@std/testing/bdd';
import { expect } from '@std/expect';
import * as Commander from 'commander';
import { extractToolDefinitions } from '../src/mcp/introspect.ts';

describe('MCP introspection', () => {
  describe('extractToolDefinitions', () => {
    it('should extract a single leaf command as one tool', () => {
      const root = new Commander.Command('myapp');
      root.description('My app');

      const sub = new Commander.Command('greet');
      sub.description('Greet someone');
      sub.option('--name <name>', 'Name to greet');
      sub.argument('<message>', 'Greeting message');
      root.addCommand(sub);

      const tools = extractToolDefinitions(root);

      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe('myapp_greet');
      expect(tools[0].description).toBe('Greet someone');
      expect(tools[0].inputSchema.properties['name']).toBeDefined();
      expect(tools[0].inputSchema.properties['name'].type).toBe('string');
      expect(tools[0].inputSchema.properties['message']).toBeDefined();
      expect(tools[0].inputSchema.properties['message'].type).toBe('string');
      expect(tools[0].inputSchema.required).toContain('message');
      expect(tools[0].argumentNames).toEqual(['message']);
    });

    it('should extract multiple subcommands', () => {
      const root = new Commander.Command('app');

      const list = new Commander.Command('list');
      list.description('List items');
      root.addCommand(list);

      const add = new Commander.Command('add');
      add.description('Add an item');
      add.argument('<item>', 'Item to add');
      root.addCommand(add);

      const tools = extractToolDefinitions(root);

      expect(tools.length).toBe(2);
      const names = tools.map((t) => t.name);
      expect(names).toContain('app_list');
      expect(names).toContain('app_add');
    });

    it('should handle nested subcommands', () => {
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

      expect(tools.length).toBe(2);
      const names = tools.map((t) => t.name);
      expect(names).toContain('hassio_light_turn-on');
      expect(names).toContain('hassio_light_turn-off');

      const onTool = tools.find((t) => t.name === 'hassio_light_turn-on')!;
      expect(onTool.inputSchema.properties['device']).toBeDefined();
      expect(onTool.inputSchema.properties['brightness']).toBeDefined();
      expect(onTool.inputSchema.required).toContain('device');
      expect(onTool.argumentNames).toEqual(['device']);
    });

    it('should skip logging options', () => {
      const root = new Commander.Command('myapp');

      const cmd = new Commander.Command('run');
      cmd.description('Run something');
      cmd.option('--log-level <level>', 'Log level');
      cmd.option('-D, --debug', 'Debug mode');
      cmd.option('--verbose', 'Verbose output');
      cmd.option('--user <name>', 'User name');
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      expect(tools.length).toBe(1);
      const props = tools[0].inputSchema.properties;
      // Logging options should be excluded
      expect(props['logLevel']).toBeUndefined();
      expect(props['debug']).toBeUndefined();
      expect(props['verbose']).toBeUndefined();
      // Real option should be present
      expect(props['user']).toBeDefined();
    });

    it('should handle boolean options', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('process');
      cmd.description('Process data');
      cmd.option('--force', 'Force processing');
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      expect(tools[0].inputSchema.properties['force'].type).toBe('boolean');
    });

    it('should handle choices on options', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('format');
      cmd.description('Format output');
      cmd.option('--type <type>', 'Output type');
      // Set choices on the option
      const opt = cmd.options[0];
      opt.choices(['json', 'yaml', 'table']);
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      expect(tools[0].inputSchema.properties['type'].enum).toEqual(['json', 'yaml', 'table']);
    });

    it('should handle variadic arguments', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('files');
      cmd.description('Process files');
      cmd.argument('<files...>', 'Files to process');
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      const prop = tools[0].inputSchema.properties['files'];
      expect(prop.type).toBe('array');
      expect(prop.items).toEqual({ type: 'string' });
      expect(tools[0].inputSchema.required).toContain('files');
      expect(tools[0].argumentNames).toEqual(['files']);
    });

    it('should handle argument choices', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('query');
      cmd.description('Query servers');
      const arg = new Commander.Argument('<server>', 'Server to query');
      arg.choices(['alpha', 'beta', 'gamma']);
      cmd.addArgument(arg);
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      expect(tools[0].inputSchema.properties['server'].enum).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('should skip hidden options', () => {
      const root = new Commander.Command('app');

      const cmd = new Commander.Command('run');
      cmd.description('Run');
      const opt = new Commander.Option('--internal <val>', 'Internal option');
      opt.hideHelp();
      cmd.addOption(opt);
      cmd.option('--visible <val>', 'Visible option');
      root.addCommand(cmd);

      const tools = extractToolDefinitions(root);

      expect(tools[0].inputSchema.properties['internal']).toBeUndefined();
      expect(tools[0].inputSchema.properties['visible']).toBeDefined();
    });
  });
});
