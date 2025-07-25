/**
 * Provides a central aggregation point for different log level implementations.
 *
 * @remarks
 * This module re-exports the `cli` and `std` log level configurations, as well
 * as the core `Level` types and classes. It simplifies access to various log
 * level definitions and their associated factory methods.
 *
 * @module
 */
// export * as cli from './cli/index.ts';
// export * as std from './std/index.ts';
// export * as Level from './level.ts';

import type { IBasic as MsgBuilderIBasic } from '../message/types.ts';
import { isLogLevelDef, LogLevels } from './base.ts';
import { CliLogger, createCliLogger } from './cli/logger.ts';
import { cliLogLevelNames, createCliLogLevels, type ICliLogger } from './cli/types.ts';
import type { IBasic } from './ibasic.ts';
import { createStdLogger, StdLogger } from './std/logger.ts';
import { createStdLogLevels, type IStdLogger, stdLogLevelNames } from './std/types.ts';
import type { FactoryMethod, LogLevelDef, LogLevelsDef, Name, Value } from './types.ts';

export const Level = {
  isLogLevelDef: isLogLevelDef,
  LogLevels: LogLevels,
};
export const cli = {
  Logger: CliLogger,
  createLogger: createCliLogger,
  LogLevelNames: cliLogLevelNames,
  createLogLevels: createCliLogLevels,
};
export const std = {
  Logger: StdLogger,
  createLogger: createStdLogger,
  LogLevelNames: stdLogLevelNames,
  createLogLevels: createStdLogLevels,
};

export interface Level {
  IBasic: IBasic;
  Name: Name;
  Value: Value;
  LogLevelDef: LogLevelDef;
  LogLevelsDef: LogLevelsDef;
  FactoryMethod: FactoryMethod;
}
export interface cli<M extends MsgBuilderIBasic> {
  ILogger: ICliLogger<M>;
}

export interface std<M extends MsgBuilderIBasic> {
  ILogger: IStdLogger<M>;
}
