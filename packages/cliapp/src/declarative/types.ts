import type { BaseOption } from './option/base.ts';

/**
 * Base context interface that all contexts must implement
 */
export interface IBaseCtx {
  close(): Promise<void>;
}

/**
 * Command definition types with flexible context
 */
export interface CommandDefinition<TOptions extends Record<string, BaseOption> = Record<PropertyKey, never>> {
  name: string;
  description: string;
  options?: TOptions;
  action: (opts: InferredOptions<TOptions>, ctx: IBaseCtx) => Promise<void>;
}

export interface RootCommandDefinition<
  TOptions extends Record<string, BaseOption> = Record<PropertyKey, never>,
  TGlobalOptions extends Record<string, BaseOption> = Record<PropertyKey, never>,
> {
  name: string;
  description: string;
  options?: TOptions;
  globalOptions?: TGlobalOptions;
  action?: (opts: InferredOptions<TOptions & TGlobalOptions>, ctx: IBaseCtx) => Promise<void>;
  subcommands?: DeclarativeCommandInterface<Record<PropertyKey, never>>[];
}

/**
 * Type to infer option types from option definitions
 */
export type InferredOptions<T extends Record<string, BaseOption>> = {
  [K in keyof T]: T[K] extends BaseOption<infer U> ? U : never;
};

/**
 * Interface for DeclarativeCommand to avoid circular imports
 */
export interface DeclarativeCommandInterface<TOptions extends Record<string, BaseOption> = Record<PropertyKey, never>> {
  definition: CommandDefinition<TOptions>;
  build(ctx: IBaseCtx, pkg?: unknown): unknown;
}
