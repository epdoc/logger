import type * as Log from '$log';
import type * as Level from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import type { Integer } from '@epdoc/type';
import type { TransportMgr } from './transports/mgr.ts';

export interface ITransportEmitter {
  emit(msg: Log.Entry): void;
}

/**
 * Lightweight emitter that captures logger context and emits directly to the transport manager.
 *
 * @remarks
 * The MsgEmitter class decouples MsgBuilder from Logger by providing a direct communication path
 * to the TransportMgr. This eliminates the complex routing chain and improves performance.
 *
 * **Architecture Flow:**
 * - **Before:** `MsgBuilder.emit()` → `Logger.emit()` → `LogMgr.emit()` → `TransportMgr.emit()`
 * - **After:** `MsgBuilder.emit()` → `MsgEmitter.emit()` → `TransportMgr.emit()`
 *
 * Each MsgEmitter instance is created by LogMgr when a logger requests a message builder,
 * capturing the necessary context (level, sid, reqIds, pkgs) and providing threshold checking.
 *
 * @example
 * ```ts
 * // Created internally by LogMgr during log.info call
 * const emitter = new MsgEmitter({
 *   level: levelSpec,
 *   transportMgr: transportMgr,
 *   context: { sid: 'session123', reqId: 'req456', pkgs: ['MyClass'], pkgSep: '.' },
 *   msgSep: 1
 * });
 *
 * // Used by MsgBuilder to emit directly
 * emitter.emit(logEntryData);
 * ```
 *
 * @public
 */
export class MsgEmitter implements MsgBuilder.IEmitter {
  #level: Level.Spec;
  #transportMgr: TransportMgr;
  #sid?: string;
  #reqId?: string;
  #pkg?: string;
  #msgSep: Integer = 1;
  #progressEnabled: boolean;
  #demark?: (name: string, keep?: boolean) => number;

  /**
   * Creates a new MsgEmitter instance with logger context and transport reference.
   *
   * @param options - Configuration options for the emitter
   *
   * @internal
   */
  constructor(options: Log.LogEmitterOpts) {
    this.#level = options.level;
    if (options.context) {
      this.#sid = options.context.sid;
      this.#reqId = options.context.reqId;
      this.#pkg = options.context.pkgs.length > 0 ? options.context.pkgs.join(options.context.pkgSep) : undefined;
    }
    this.#msgSep = options.msgSep;
    this.#transportMgr = options.transportMgr;
    this.#progressEnabled = options.progressEnabled ?? false;
    this.#demark = options.demark;
  }

  /**
   * Indicates whether data operations should be processed based on threshold evaluation.
   *
   * @remarks
   * Used by MsgBuilder to determine if data-heavy operations like object serialization
   * should be performed. Returns false when the log level doesn't meet the threshold,
   * allowing for performance optimization.
   *
   * @returns True if data operations should be processed
   *
   * @public
   */
  get dataEnabled(): boolean {
    return this.#transportMgr.meetsAnyThreshold(this.#level);
  }

  /**
   * Indicates whether emit operations should be processed based on threshold evaluation.
   *
   * @remarks
   * Used by MsgBuilder to determine if the message should be emitted to transports.
   * Returns false when the log level doesn't meet the threshold.
   *
   * @returns True if emit operations should be processed
   *
   * @public
   */
  get emitEnabled(): boolean {
    return this.#transportMgr.meetsAnyThreshold(this.#level);
  }

  /**
   * Indicates whether stack trace operations should be processed based on threshold evaluation.
   *
   * @remarks
   * Used by MsgBuilder to determine if expensive stack trace generation should occur.
   * Returns false when the log level doesn't meet the threshold.
   *
   * @returns True if stack operations should be processed
   *
   * @public
   */
  get stackEnabled(): boolean {
    return this.#transportMgr.meetsAnyThreshold(this.#level);
  }

  /**
   * Indicates whether progress mode is enabled for this log level.
   *
   * @remarks
   * Progress mode is enabled when the log level exactly matches the threshold.
   * When enabled, progress indicators (spinners, progress bars) should be shown
   * instead of emitting normal log messages. This allows for interactive progress
   * display at the threshold level while maintaining normal logging behavior
   * above and below it.
   *
   * @returns True if progress mode should be used
   *
   * @example
   * ```ts
   * if (this._emitter.progressEnabled) {
   *   // Show spinner/progress bar
   *   this.#progressLine.start(this.format());
   * } else if (this._emitter.emitEnabled) {
   *   // Emit normal log message
   *   this.emit();
   * }
   * ```
   *
   * @public
   */
  get progressEnabled(): boolean {
    return this.#progressEnabled;
  }

  /**
   * Measures elapsed time since a performance mark was created.
   *
   * @param name - The name of the mark to measure
   * @param keep - If true, preserves the mark for future measurements; if false, removes it
   * @returns The elapsed time in milliseconds, or 0 if mark not found or demark function unavailable
   *
   * @remarks
   * This method provides the performance timing functionality for the `ewt()` (Emit With Time)
   * feature. It delegates to the logger's demark function passed during construction.
   *
   * @example
   * ```ts
   * // Used internally by MsgBuilder.ewt()
   * const elapsed = emitter.demark('operation-mark', false);
   * // Returns elapsed time like 123.45 (milliseconds)
   * ```
   *
   * @public
   */
  demark(name: string, keep = false): number {
    return this.#demark ? this.#demark(name, keep) : 0;
  }

  /**
   * Emits a log entry directly to the transport manager.
   *
   * @param data - The message data from MsgBuilder containing formatted content and metadata
   * @returns The same data object for potential chaining
   *
   * @remarks
   * This is the core emit method that bypasses Logger and LogMgr, providing direct
   * communication between MsgBuilder and TransportMgr. It:
   *
   * 1. Creates a complete Log.Entry with context information
   * 2. Emits directly to the transport manager
   *
   * @example
   * ```ts
   * // Called by MsgBuilder.emit()
   * const data = {
   *   timestamp: new Date(),
   *   formatter: 'Formatted message',
   *   data: { key: 'value' }
   * };
   * emitter.emit(data);
   * ```
   *
   * @public
   */
  emit = (data: MsgBuilder.EmitterData): MsgBuilder.EmitterData => {
    const entry: Log.Entry = {
      level: this.#level,
      timestamp: data.timestamp,
      time: data.elapsed,
      sid: this.#sid,
      reqId: this.#reqId,
      pkg: this.#pkg,
      msg: data.formatter,
      msgSep: this.#msgSep,
      data: data.data,
    };
    this.#transportMgr.emit(entry);

    return data;
  };
}
