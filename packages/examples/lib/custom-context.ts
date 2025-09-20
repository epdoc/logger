import * as Log from '../../packages/logger/src/mod.ts';
import { type CustomMsgBuilder, customMsgBuilderFactory } from './custom-msg-builder.ts';

export interface IBuilder extends Log.MsgBuilder.Base.Builder {
  h1(...args: unknown[]): this;
  text(...args: unknown[]): this;
  error(...args: unknown[]): this;
  label(...args: unknown[]): this;
  ewt(...args: unknown[]): unknown;
  err(...args: unknown[]): this;
}

/**
 * Defines the interface for the application logger.
 * It extends standard logger capabilities with indentation and event emitting.
 * @template M - The message builder type, which must extend `Log.MsgBuilder.IBasic`.
 */
export interface ILogger<M extends IBuilder> extends Log.Indent.Logger<M> {
  readonly info: M;
  readonly error: M;
}

// This is a simplified version of the CliApp.ICtx interface
export interface ICustomCtx<M extends IBuilder, L extends ILogger<M>> {
  log: L;
  logMgr: Log.Mgr<M>;
}

export type MC = CustomMsgBuilder;
export type LS = Log.Std.Logger<MC>;

export interface ILogCtx extends ICustomCtx<MC, LS> {
  silent: boolean;
}

export const logMgr: Log.Mgr<MC> = new Log.Mgr<MC>();
logMgr.msgBuilderFactory = customMsgBuilderFactory;
logMgr.init();
logMgr.threshold = 'info';

export class CustomContext implements ILogCtx {
  log: LS;
  logMgr: Log.Mgr<MC> = logMgr;
  silent = false;

  constructor() {
    this.log = logMgr.getLogger<LS>();
  }
}
