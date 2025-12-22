import type { IEmitter } from '../types.ts';
import { ConsoleMsgBuilder } from './builder.ts';

/**
 * Type for extension methods that can be added to Console.Builder
 */
// deno-lint-ignore no-explicit-any
type ExtenderMethod = (this: ConsoleMsgBuilder, ...args: any[]) => ConsoleMsgBuilder;

/**
 * MsgBuilder extension helper, makes it easy to extend Console.Builder with custom methods
 *
 * Creates an extended Console.Builder class with custom methods.
 * Handles the complex factory and inheritance patterns internally.
 *
 * @param extensions - Object with custom methods to add to the builder
 * @returns Extended builder class that can be used with Log.Mgr
 *
 * @example
 * ```typescript
 * const MyBuilder = Console.extender({
 *   apiCall(method: string, url: string) {
 *     return this.label(method).text(' ').underline.text(url);
 *   },
 *   metric(name: string, value: number) {
 *     return this.cyan.text(name).text(': ').bold.text(value.toString());
 *   }
 * });
 *
 * // Use with logger
 * const logMgr = createLogManager(MyBuilder);
 * const logger = logMgr.getLogger();
 * logger.info.apiCall('GET', '/api/users').emit();
 * ```
 */
export function extender<T extends Record<string, ExtenderMethod>>(
  extensions: T,
): new (emitter: IEmitter) => ConsoleMsgBuilder & T {
  class ExtendedBuilder extends ConsoleMsgBuilder {
    constructor(emitter: IEmitter) {
      super(emitter);
      // Bind extension methods to this instance
      Object.entries(extensions).forEach(([name, method]) => {
        // deno-lint-ignore no-explicit-any
        (this as any)[name] = method.bind(this);
      });
    }
  }

  // deno-lint-ignore no-explicit-any
  return ExtendedBuilder as any;
}

/**
 * Type helper to infer the extended builder type
 */
export type ExtendedBuilder<T extends Record<string, ExtenderMethod>> = ConsoleMsgBuilder & T;
