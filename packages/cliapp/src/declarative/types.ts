import type * as Ctx from '../context/mod.ts';
import type * as Option from './option/mod.ts';

export type ParseOptionValue = string | number | boolean | string[] | number[];

/**
 * Parsed option values from Commander.js
 */
export type ParsedOptions = Record<string, ParseOptionValue>;

/**
 * Command argument definition
 */
export interface ArgumentDefinition {
  name: string;
  description: string;
  required?: boolean;
  variadic?: boolean; // for <files...> syntax
}

/**
 * Command definition using separate declaration pattern
 */
export interface CommandDefinition {
  name: string;
  description: string;
  arguments?: ArgumentDefinition[];
  /** options includes root options (merged by Commander.js) */
  options?: Record<string, Option.Base>;
  action: (ctx: Ctx.IBase, args: string[], opts: ParsedOptions) => Promise<void>;
}

/**
 * Root command definition with rootOptions available to all subcommands
 * Logger options are added separately via cmd.addLogging()
 */
export interface RootCommandDefinition extends CommandDefinition {
  commands?: Record<string, DeclarativeCommandInterface>;
}

/**
 * Interface for DeclarativeCommand to avoid circular imports
 */
export interface DeclarativeCommandInterface {
  definition: CommandDefinition;
  build?(ctx: Ctx.IBase, pkg?: unknown): unknown;
}
