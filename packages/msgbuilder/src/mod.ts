import * as Console from './console/mod.ts';

export { AbstractMsgBuilder as Abstract } from './abstract.ts';
export { ConsoleEmitter, TestEmitter } from './emitter.ts';
export * from './types.ts';
export { Console };

/**
 * @deprecated Use direct class extension instead: `class MyBuilder extends Console.Console.Builder { }`
 */
// export { type ExtendedBuilder, extender as extendBuilder } from './console/extender.ts';
