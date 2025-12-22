// message/console/mod.ts
import { ConsoleMsgBuilder } from './builder.ts';
import type { IConsoleErrOpts, IConsoleMsgBuilder } from './types.ts';

// Re-export the class under the desired name 'Builder'
export { ConsoleMsgBuilder as Builder };

// Re-export types with their desired aliases
export { consoleStyleFormatters as styleFormatters, createConsoleMsgBuilder, createMsgBuilder } from './const.ts';
export { extender } from './extender.ts';
export type { IConsoleErrOpts as IErrOpts, IConsoleMsgBuilder as IConsole };
