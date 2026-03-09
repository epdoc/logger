import type { Entry } from './types.ts';

/**
 * Handler function type for log entry events.
 */
export type LogEventHandler = (entry: Entry) => void;

/**
 * Interface for a lightweight event bus that decouples log entry producers from consumers.
 *
 * @remarks
 * The LogEventBus provides a publish-subscribe pattern for log entries, allowing:
 * - Complete decoupling between MsgBuilder/Loggers and Transports
 * - Easy addition of new consumers (metrics, filtering, etc.) without modifying existing code
 * - Pure data Entry objects without infrastructure references
 *
 * @example
 * ```ts
 * const bus = new SimpleLogEventBus();
 *
 * // Subscribe a transport
 * const unsubscribe = bus.onEmit((entry) => {
 *   console.log(entry.msg);
 * });
 *
 * // Emit a log entry
 * bus.emit({
 *   level: logLevels.infoLevel,
 *   msg: 'Hello World',
 *   timestamp: new Date()
 * });
 *
 * // Unsubscribe when done
 * unsubscribe();
 * ```
 */
export interface LogEventBus {
  /**
   * Emits a log entry to all registered handlers.
   *
   * @param entry - The log entry to emit
   */
  emit(entry: Entry): void;

  /**
   * Registers a handler to receive log entries.
   *
   * @param handler - The handler function to call for each entry
   * @returns A function that unsubscribes the handler when called
   */
  onEmit(handler: LogEventHandler): () => void;

  /**
   * Checks if any handler is currently registered.
   *
   * @returns True if at least one handler is registered
   */
  hasHandlers(): boolean;

  /**
   * Removes all registered handlers.
   */
  clear(): void;
}

/**
 * A simple synchronous implementation of the LogEventBus.
 *
 * @remarks
 * This implementation processes handlers synchronously in the order they were
 * registered. It is suitable for most logging use cases where minimal overhead
 * is desired.
 */
export class SimpleLogEventBus implements LogEventBus {
  #handlers: Set<LogEventHandler> = new Set();

  /**
   * Emits a log entry to all registered handlers.
   *
   * @param entry - The log entry to emit
   */
  emit(entry: Entry): void {
    this.#handlers.forEach((handler) => {
      try {
        handler(entry);
      } catch (err) {
        // Prevent one failing handler from breaking others
        console.error('LogEventBus handler error:', err);
      }
    });
  }

  /**
   * Registers a handler to receive log entries.
   *
   * @param handler - The handler function to call for each entry
   * @returns A function that unsubscribes the handler when called
   */
  onEmit(handler: LogEventHandler): () => void {
    this.#handlers.add(handler);
    return () => {
      this.#handlers.delete(handler);
    };
  }

  /**
   * Checks if any handler is currently registered.
   *
   * @returns True if at least one handler is registered
   */
  hasHandlers(): boolean {
    return this.#handlers.size > 0;
  }

  /**
   * Removes all registered handlers.
   */
  clear(): void {
    this.#handlers.clear();
  }
}

/**
 * Factory function to create a default LogEventBus instance.
 *
 * @returns A new LogEventBus instance
 */
export function createLogEventBus(): LogEventBus {
  return new SimpleLogEventBus();
}
