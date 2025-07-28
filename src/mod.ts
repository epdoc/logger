/**
 * The `Log` module serves as the top-level namespace for the entire @epdoc/logger
 * module. Deno doc is not capable of generating the documentation for this project.
 *
 * @remarks
 * It exports all the core components required for logging, including the
 * {@link LogMgr} for management, various {@link Logger} implementations, and transport
 * mechanisms. This centralized export structure simplifies imports and provides a
 * single entry point to access the library's functionalities.
 *
 * @module
 */
export { isTimestampFormat, TimestampFormat } from './consts.ts';
export * as Level from './levels/mod.ts';
export * from './loggers/mod.ts';
export { LogMgr as Mgr } from './logmgr.ts';
export * as MsgBuilder from './message/mod.ts';
export * as Transport from './transports/mod.ts';
export type {
  EmitterShowKey,
  EmitterShowOpts,
  Entry,
  ILogMgrSettings as IMgrSettings,
  TimestampFormatType,
} from './types.ts';
