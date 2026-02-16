// message/console/mod.ts
import { ConsoleMsgBuilder } from './builder.ts';
import type { IConsoleErrOpts, IConsoleMsgBuilder } from './types.ts';

// Re-export the class under the desired name 'Builder'
export { ConsoleMsgBuilder as Builder };

// Re-export style maps for theming
export {
  consoleStyleFormatters as styleFormatters,
  consoleStyleFormattersV0 as styleFormattersV0,
  consoleStyleFormattersV1 as styleFormattersV1,
  createConsoleMsgBuilder,
  createMsgBuilder,
} from './const.ts';

/**
 * @deprecated Use direct class extension instead: `class MyBuilder extends Builder { }`
 */
export { extender } from './extender.ts';

// Re-export types with their desired aliases
export type { IConsoleErrOpts as IErrOpts, IConsoleMsgBuilder as IConsole };

// Re-export new style types
export type { ConsoleStyleKey, ConsoleStyleMap } from './types.ts';
