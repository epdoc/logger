/**
 * The `Log` module serves as the top-level namespace for the entire logging
 * system.
 *
 * @remarks
 * It exports all the core components required for logging, including the
 * {@link Log.Mgr} for management, various logger implementations, and transport
 * mechanisms. This centralized export structure simplifies imports and provides a
 * single entry point to access the library's functionalities.
 *
 * @module
 */
export { isTimestampFormat, TimestampFormat } from './consts.ts';
export * as Level from './levels/mod.ts';
export * from './logger/mod.ts';
export { type ILogMgrSettings as IMgrSettings, LogMgr as Mgr } from './logmgr.ts';
export * as MsgBuilder from './message/mod.ts';
export * as Transport from './transports/mod.ts';
export type { EmitterShowKey, EmitterShowOpts, Entry, TimestampFormatType } from './types.ts';
