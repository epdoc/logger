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
export { cli, Level, std } from './levels/index.ts';
export * as Logger from './logger/index.ts';
export { type ILogMgrSettings as IMgrSettings, LogMgr as Mgr } from './logmgr.ts';
export * as MsgBuilder from './message/index.ts';
export * as Transport from './transports/index.ts';
export { isTimestampFormat, TimestampFormat } from './types.ts';
export type { EmitterShowKey, EmitterShowOpts, Entry, IEmitter } from './types.ts';
