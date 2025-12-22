export * from '$logger';
export { isTimestampFormat, TimestampFormat } from './consts.ts';
export { Emitter } from './emitter.ts';
export { LogMgr as Mgr } from './logmgr.ts';
export * as Transport from './transports/mod.ts';

// Export AbstractLogger and types for external logger implementations
export { AbstractLogger } from './loggers/base/logger.ts';
export type { IEmitter, IFactoryMethods, IGetChildParams } from './loggers/types.ts';

export type {
  EmitterShowKey,
  EmitterShowOpts,
  Entry,
  ILogMgrSettings as IMgrSettings,
  TimestampFormatType,
} from './types.ts';

// Helper functions
export { createLogManager, type LogManagerOptions } from './helpers.ts';

// Helper functions
export { createLogManager, type LogManagerOptions } from './helpers.ts';
