export * from '$logger';
export { isTimestampFormat, TimestampFormat } from './consts.ts';
export { LogMgr as Mgr } from './logmgr.ts';
export { MsgEmitter as Emitter } from './msg-emitter.ts';
export * as Transport from './transports/mod.ts';

// Export AbstractLogger and types for external logger implementations
export { AbstractLogger } from './loggers/base/logger.ts';
export type { IFactoryMethods, ILoggerEmitter as IEmitter } from './loggers/interfaces.ts';

export type {
  EmitterShowKey,
  EmitterShowOpts,
  Entry,
  IGetChildParams,
  ILogMgrSettings as IMgrSettings,
  TimestampFormatType,
} from './types.ts';
