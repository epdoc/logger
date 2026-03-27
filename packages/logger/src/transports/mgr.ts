import type * as Log from '$log';
import type * as Level from '@epdoc/loglevels';
import { assert } from '@std/assert';
import type { AbstractTransport } from './base/transport.ts';
import { ConsoleTransport } from './console/transport.ts';
import type { IBaseOptions } from './types.ts';

/**
 * Interface for progress line objects stored by TransportMgr.
 * This is a minimal interface that @epdoc/progress.Line satisfies.
 */
export interface IProgressLine {
  start(message: string): void;
  update(message: string, progress?: number): void;
  stop(finalMessage?: string): void;
  readonly isActive: boolean;
}

/**
 * Context for a single progress operation in the nesting stack.
 * Stores all state needed to restore parent progress when nesting.
 */
export interface ProgressContext {
  /** The progress line instance from @epdoc/progress */
  line: IProgressLine;
  /** Timestamp when this progress started */
  startTime: number;
  /** The log level name that started this progress */
  levelName: string;
  /** The message text for this progress level */
  message: string;
  /** Optional progress configuration */
  options?: Record<string, unknown>;
}

/**
 * Manages a collection of log transports, handling the distribution of log
 * entries to each registered transport.
 */
export class TransportMgr {
  protected _bRunning = false;
  protected _logMgr: IBaseOptions;
  protected _queue: Log.Entry[] = [];
  /**
   * An array of registered transport instances.
   */
  transports: AbstractTransport[] = [];

  // Stack-based progress tracking for nested progress support
  #progressStack: ProgressContext[] = [];

  /**
   * Creates an instance of the `TransportMgr`.
   * @param {IBaseOptions} logMgr - The log manager context.
   */
  constructor(logMgr: IBaseOptions) {
    this._logMgr = logMgr;
  }

  /**
   * Get the currently active progress line, if any.
   * @returns The active IProgressLine or undefined
   */
  get activeProgress(): IProgressLine | undefined {
    return this.#progressStack.length > 0 ? this.#progressStack[this.#progressStack.length - 1].line : undefined;
  }

  /**
   * Get the start time of the current progress operation.
   * @returns Timestamp when progress started, or undefined
   */
  get progressStartTime(): number | undefined {
    return this.#progressStack.length > 0 ? this.#progressStack[this.#progressStack.length - 1].startTime : undefined;
  }

  /**
   * Get the level name that started the current progress.
   * Used to verify updates use the same level.
   * @returns Level name or undefined
   */
  get progressLevelName(): string | undefined {
    return this.#progressStack.length > 0 ? this.#progressStack[this.#progressStack.length - 1].levelName : undefined;
  }

  /**
   * Get the current nesting depth of progress operations.
   * 0 means no active progress, 1 means single progress, 2+ means nested.
   * @returns The nesting depth
   */
  get progressNestingDepth(): number {
    return this.#progressStack.length;
  }

  /**
   * Check if there is any active progress.
   * @returns True if progress is active
   */
  get hasActiveProgress(): boolean {
    return this.#progressStack.length > 0;
  }

  /**
   * Get the parent progress context (the one before the current).
   * @returns The parent ProgressContext or undefined if at top level
   */
  get parentProgressContext(): ProgressContext | undefined {
    return this.#progressStack.length > 1 ? this.#progressStack[this.#progressStack.length - 2] : undefined;
  }

  /**
   * Set the active progress line.
   * For nested progress, the parent context is automatically pushed to the stack.
   *
   * @param line - The IProgressLine to activate, or undefined to clear
   * @param levelName - The log level name that started this progress
   * @param message - The message text for this progress
   * @param options - Optional progress configuration
   */
  setActiveProgress(line: IProgressLine | undefined, levelName?: string, message?: string, options?: Record<string, unknown>): void {
    if (line === undefined) {
      // Clear entire stack
      if (this.#progressStack.length > 0) {
        const current = this.#progressStack[this.#progressStack.length - 1];
        if (current.line.isActive) {
          current.line.stop();
        }
      }
      this.#progressStack = [];
      return;
    }

    // Create new context and push to stack
    const context: ProgressContext = {
      line,
      startTime: performance.now(),
      levelName: levelName ?? 'INFO',
      message: message ?? '',
      options,
    };
    this.#progressStack.push(context);
  }

  /**
   * Push a new nested progress context onto the stack.
   * This adds a new level to the nesting without creating a new Progress.Line.
   * The same progress line is used, but the message is updated.
   *
   * @param childMessage - The message for the nested progress level
   * @param levelName - The log level name for this nesting level
   * @returns True if successfully pushed
   */
  pushNestedProgress(childMessage: string, levelName: string): boolean {
    if (this.#progressStack.length === 0) {
      return false;
    }
    // Get the current progress line to reuse it
    const currentContext = this.#progressStack[this.#progressStack.length - 1];
    
    // Create new context that shares the same progress line
    const nestedContext: ProgressContext = {
      line: currentContext.line,
      startTime: performance.now(),  // Track nested start time separately
      levelName: levelName,
      message: childMessage,
      options: currentContext.options,
    };
    
    this.#progressStack.push(nestedContext);
    return true;
  }

  /**
   * Pop the current progress context and restore the parent.
   * Called when completing a nested progress.
   *
   * @returns The parent ProgressContext or undefined if stack is empty
   */
  popProgressContext(): ProgressContext | undefined {
    if (this.#progressStack.length === 0) {
      return undefined;
    }
    
    // Remove current context
    this.#progressStack.pop();
    
    // Return the new current context (parent) if any
    return this.#progressStack.length > 0 ? this.#progressStack[this.#progressStack.length - 1] : undefined;
  }

  /**
   * Clear all progress state and stop any active progress.
   * This is the nuclear option - use cancel() for cleanup.
   */
  clearActiveProgress(): void {
    this.setActiveProgress(undefined);
  }

  /**
   * Sets the log level threshold for all registered transports.
   *
   * @param {Level.Name | Level.Severity} level - The log level to set.
   * @returns {this} The current instance for method chaining.
   */
  setThreshold(level: Level.Spec): this {
    this.transports.forEach((transport) => {
      transport.setThreshold(level);
    });
    return this;
  }

  /**
   * Checks if any transport meets the specified log level threshold. Some transports may not have
   * thresholds set, in which case they don't participate in this calculation, and so we should
   * leave it up to the logger or logMgr threshold.
   *
   * @param {Level.Severity} levelVal - The numerical value of the log level.
   * @returns {boolean} `true` if any transport meets the threshold, otherwise `false`.
   */
  meetsAnyThreshold(level: Level.Spec): boolean {
    assert(this.transports.length, 'No transports');
    return this.transports.some((transport) => {
      const result = transport.compareToTransportThreshold(level);
      return result !== undefined && result >= 0;
    });
  }

  /**
   * Gets the minimum (most permissive) threshold across all transports.
   * Returns the threshold with the lowest severity number.
   *
   * @returns {Level.Spec | undefined} The minimum threshold, or undefined if no transports.
   */
  getMinThreshold(): Level.Spec | undefined {
    if (this.transports.length === 0) {
      return undefined;
    }
    return this.transports.reduce((min, transport) => {
      return transport.threshold.severity < min.severity ? transport.threshold : min;
    }, this.transports[0].threshold);
  }

  /**
   * Checks if any registered transport can show progress.
   * Progress mode is only applicable when there's a Console transport
   * with progress enabled running in an interactive TTY.
   *
   * @returns {boolean} True if there's at least one progress-capable Console transport
   */
  hasProgressCapableTransport(): boolean {
    const found = this.transports.filter((transport) => {
      return transport.canShowProgress;
    });
    return found ? true : false;
  }

  /**
   * Configures the display options for all registered transports.
   *
   * @param {Log.EmitterShowOpts} opts - The display options to set.
   * @returns {this} The current instance for method chaining.
   */
  show(opts: Log.EmitterShowOpts): this {
    this.transports.forEach((transport) => {
      transport.setShow(opts);
    });
    return this;
  }

  /**
   * Starts all registered transports.
   *
   * If no transports are registered, a default `Console` transport is added.
   *
   * @returns {Promise<void>} A promise that resolves when all transports have started.
   */
  start(): Promise<void> {
    if (!this.transports.length) {
      const transport = new ConsoleTransport(this._logMgr);
      this.transports.push(transport);
    }
    const jobs: Promise<void>[] = [];
    this.transports.forEach((transport) => {
      jobs.push(transport.setup());
    });
    return Promise.all(jobs).then(() => {
      this._bRunning = true;
      // Flush any queued messages now that transports are started
      this.flushQueue();
      return;
    });
  }

  /**
   * Indicates whether the transport manager is running.
   * @returns {boolean} `true` if running, otherwise `false`.
   */
  isRunning(): boolean {
    return this._bRunning;
  }

  /**
   * Checks if all transports are ready.
   * @returns {boolean} `true` if all transports are ready, otherwise `false`.
   */
  allReady(): boolean {
    return this.transports.every((t) => t.ready);
  }

  /**
   * Adds a new transport to the manager. Asynchronous when adding to an already running manager.
   *
   * @param {AbstractTransport<M>} transport - The transport instance to add.
   */
  async add(transport: AbstractTransport): Promise<void> {
    if (this._bRunning) {
      this._bRunning = false;
      this.transports.unshift(transport);
      this._bRunning = true;
      await transport.setup();
    } else {
      this.transports.unshift(transport);
    }
  }

  /**
   * Removes a transport from the manager.
   *
   * @param {AbstractTransport<M>} transport - The transport instance to remove.
   * @returns {Promise<void>} A promise that resolves when the transport is removed.
   */
  async remove(transport: AbstractTransport): Promise<void> {
    this._bRunning = false;
    const name = transport.toString();
    const found = this.transports.find((t) => {
      return t.match(transport);
    });
    if (found) {
      await found.destroy();
    }
    this.transports = this.transports.filter((t) => {
      return t.alive;
    });
    const msg: Log.Entry = {
      level: this._logMgr.logLevels.defaultLevel,
      pkg: 'logger.transport.remove',
      msg: `Removed transport '${name}'`,
    };

    this.emit(msg);
  }

  /**
   * Stops all registered transports.
   *
   * @returns {Promise<void>} A promise that resolves when all transports have stopped.
   */
  async stop(): Promise<void> {
    const jobs: Promise<void>[] = [];
    this.flushQueue();
    this.transports.forEach((transport) => {
      jobs.push(transport.stop());
    });
    await Promise.all(jobs);
  }

  /**
   * Emits a log entry to all registered transports.
   * If not all transports are ready, queues the message.
   *
   * @param msg - The log entry to emit.
   * @param flush - Whether to force any transports to flush their buffers or batched messages right away. This might be done for error messages.
   */
  emit(msg: Log.Entry): void {
    const flush = msg.level.severity >= this._logMgr.logLevels.flushLevel.severity;
    if (this.allReady()) {
      // All transports ready - emit directly and flush any queued messages
      this.flushQueue();
      this.#emitToTransports(msg, flush);
    } else {
      // Queue the message until all transports are ready
      this._queue.push(msg);
    }
  }

  /**
   * Emits a message directly to all transports without queuing.
   * @private
   */
  #emitToTransports(msg: Log.Entry, flush = false): void {
    for (const transport of this.transports) {
      transport.emit(msg);
      if (flush) {
        transport.flush();
      }
    }
  }

  /**
   * Flushes all queued messages to transports when they become ready.
   * @param flush - Whether to force any transports to flush their buffers or batched messages right away. This might be done for error messages.
   */
  flushQueue(flush = false): void {
    while (this._queue.length > 0 && this.allReady()) {
      const msg = this._queue.shift()!;
      this.#emitToTransports(msg, flush);
    }
  }
}
