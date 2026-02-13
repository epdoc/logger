/**
 * @file Command tree introspection for MCP tool generation
 * @description Walks the cliapp command tree and extracts MCP tool definitions
 * by introspecting Commander.js Command, Option, and Argument objects.
 * @module
 */

import type * as Commander from 'commander';
import type { JsonSchema, JsonSchemaProperty, ToolDefinition } from './types.ts';

/**
 * Set of option attribute names that are internal cliapp logging controls.
 * These are excluded from MCP tool schemas since they are not meaningful
 * when commands are invoked programmatically.
 */
const LOGGING_OPTIONS = new Set([
  'logLevel',
  'verbose',
  'debug',
  'trace',
  'spam',
  'logShow',
  'logShowAll',
  'color',
  'noColor',
  'dryRun',
  'version',
]);

/**
 * Walk the command tree and extract MCP tool definitions from leaf commands.
 *
 * A "leaf command" is one that has no subcommands. Each leaf command becomes
 * an MCP tool with its options and arguments mapped to the tool's inputSchema.
 *
 * @param rootCmd - The initialized root Commander.Command to introspect
 * @returns Array of MCP tool definitions
 */
export function extractToolDefinitions(rootCmd: Commander.Command): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  walkCommands(rootCmd, [], tools);
  return tools;
}

/**
 * Recursively walks the command tree collecting tool definitions for leaf commands.
 *
 * @param cmd - Current Commander.Command node
 * @param path - Accumulated command name path from root
 * @param tools - Output array to collect tool definitions
 */
function walkCommands(
  cmd: Commander.Command,
  path: string[],
  tools: ToolDefinition[],
): void {
  const name = cmd.name();
  const currentPath = name ? [...path, name] : path;

  const subCommands = cmd.commands;

  if (subCommands.length === 0) {
    // Leaf command - create a tool definition
    if (currentPath.length === 0) return; // Skip if root has no name and no subcommands

    const toolName = currentPath.join('_');
    const description = cmd.description() || `Execute the ${toolName} command`;
    const { schema, argumentNames } = buildInputSchema(cmd, currentPath.length <= 1);

    tools.push({
      name: toolName,
      description,
      inputSchema: schema,
      argumentNames: argumentNames.length > 0 ? argumentNames : undefined,
    });
  } else {
    // Branch command - recurse into subcommands
    for (const sub of subCommands) {
      walkCommands(sub, currentPath, tools);
    }
  }
}

/**
 * Builds a JSON Schema inputSchema from a Commander.Command's options and arguments.
 *
 * @param cmd - The Commander.Command to extract schema from
 * @param isRoot - Whether this is the root command (root options are inherited by all commands)
 * @returns JSON Schema object suitable for MCP tool inputSchema
 */
function buildInputSchema(
  cmd: Commander.Command,
  _isRoot: boolean,
): { schema: JsonSchema; argumentNames: string[] } {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];
  const argumentNames: string[] = [];

  // Collect options from this command and its parents (excluding logging options)
  const allOptions = collectOptions(cmd);
  for (const opt of allOptions) {
    const attrName = opt.attributeName();

    // Skip internal logging options
    if (LOGGING_OPTIONS.has(attrName)) continue;
    // Skip hidden options
    if (opt.hidden) continue;
    // Skip negated options (--no-*)
    if (opt.negate) continue;

    const prop: JsonSchemaProperty = {
      type: inferOptionType(opt),
      description: opt.description,
    };

    if (opt.defaultValue !== undefined) {
      prop.default = opt.defaultValue;
    }
    if (opt.argChoices) {
      prop.enum = [...opt.argChoices];
    }

    properties[attrName] = prop;

    if (opt.mandatory) {
      required.push(attrName);
    }
  }

  // Process positional arguments
  for (const arg of cmd.registeredArguments) {
    const argName = arg.name();
    argumentNames.push(argName);

    const prop: JsonSchemaProperty = {
      type: arg.variadic ? 'array' : 'string',
      description: arg.description,
    };

    if (arg.variadic) {
      prop.items = { type: 'string' };
    }
    if (arg.defaultValue !== undefined) {
      prop.default = arg.defaultValue;
    }
    if (arg.argChoices) {
      prop.enum = [...arg.argChoices];
    }

    properties[argName] = prop;

    if (arg.required) {
      required.push(argName);
    }
  }

  const schema: JsonSchema = { type: 'object', properties };
  if (required.length > 0) {
    schema.required = required;
  }
  return { schema, argumentNames };
}

/**
 * Collects all non-inherited options for a command, walking up to include
 * parent command options that are meaningful (non-logging).
 */
function collectOptions(cmd: Commander.Command): Commander.Option[] {
  // Only use this command's own options. Parent options are inherited
  // by Commander.js automatically during parsing via optsWithGlobals(),
  // but for schema purposes we only show this command's options.
  return [...cmd.options];
}

/**
 * Infers the JSON Schema type for a Commander.js Option based on its characteristics.
 *
 * @param opt - The Commander.Option to inspect
 * @returns JSON Schema type string
 */
function inferOptionType(opt: Commander.Option): string {
  if (opt.isBoolean()) return 'boolean';
  if (opt.variadic) return 'array';
  if (typeof opt.defaultValue === 'number') return 'number';
  return 'string';
}
