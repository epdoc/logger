/**
 * Logger core 'namespace', exports everything from the project, including objects, functions and types.
 * @module Log
 * @remarks Contains {@link Log.Mgr}, {@link Log.Logger}
 */

import { cli, Level, std } from './src/levels/mod.ts';
import { type ILogMgrSettings, LogMgr } from './src/logmgr.ts';
import type { EmitterShowKey, EmitterShowOpts, Entry } from './src/types.ts';

export const Log = {
  cli: cli,
  std: std,
  Level: Level,
  Mgr: LogMgr,
};

export interface Log<M> {
  cli: cli<M>;
  std: std<M>;
  Level: Level;
  ILogMgrSettings: ILogMgrSettings;
  Entry: Entry;
  EmitterShowOpts: EmitterShowOpts;
  EmitterShowKey: EmitterShowKey;
}
