export * from '$logger';
export { isTimestampFormat, TimestampFormat } from './consts.ts';
export { Emitter } from './emitter.ts';
export { LogMgr as Mgr } from './logmgr.ts';
export * as Transport from './transports/mod.ts';
export type {
  EmitterShowKey,
  EmitterShowOpts,
  Entry,
  ILogMgrSettings as IMgrSettings,
  TimestampFormatType,
} from './types.ts';
