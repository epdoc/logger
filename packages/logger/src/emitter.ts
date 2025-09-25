import type * as Level from '$level';
import type * as Log from '$log';
import type * as Transport from '$transport';
import type * as MsgBuilder from '@epdoc/msgbuilder';

/**
 * Lightweight emitter that captures logger context and directly emits to the transport manager.
 *
 * @remarks
 * The Emitter class decouples MsgBuilder from Logger by providing a direct communication path
 * to the TransportMgr. This eliminates the complex routing chain and improves performance.
 *
 * **Architecture Flow:**
 * - **Before:** `MsgBuilder.emit()` → `Logger.emit()` → `LogMgr.emit()` → `TransportMgr.emit()`
 * - **After:** `MsgBuilder.emit()` → `Emitter.emit()` → `TransportMgr.emit()`
 *
 * Each Emitter instance is created by LogMgr when a logger requests a message builder,
 * capturing the necessary context (level, sid, reqIds, pkgs) and threshold information.
 *
 * @example
 * ```ts
 * // Created internally by LogMgr during log.info call
 * const emitter = new Emitter(
 *   'INFO',
 *   transportMgr,
 *   { sid: 'session123', reqIds: ['req456'], pkgs: ['MyClass'] },
 *   { meetsThreshold: true, meetsFlushThreshold: false }
 * );
 *
 * // Used by MsgBuilder to emit directly
 * emitter.emit(logEntryData);
 * ```
 *
 * @public
 */
export class Emitter implements MsgBuilder.IEmitter {
  private readonly _level: Level.Name;
  private readonly _transportMgr: Transport.Mgr;
  private readonly _sid?: string;
  private readonly _reqId?: string;
  private readonly _pkg?: string;
  private readonly _meetsThreshold: boolean;
  private readonly _meetsFlushThreshold: boolean;
  private readonly _flushCallback?: () => void;
  private readonly _demark?: (name: string, keep?: boolean) => number;

  /**
   * Creates a new Emitter instance with logger context and transport reference.
   *
   * @param level - The log level for this emitter
   * @param transportMgr - Direct reference to the transport manager
   * @param context - Logger context containing sid, reqIds, and pkgs
   * @param thresholds - Threshold evaluation results
   * @param flushCallback - Optional callback to trigger flush operations
   * @param demark - Optional performance timing function for ewt() support
   *
   * @internal
   */
  constructor(
    level: Level.Name,
    transportMgr: Transport.Mgr,
    context: {
      sid?: string;
      reqId?: string;
      pkgs: string[];
      pkgSep: string;
    },
    thresholds: {
      meetsThreshold: boolean;
      meetsFlushThreshold: boolean;
    },
    flushCallback?: () => void,
    demark?: (name: string, keep?: boolean) => number,
  ) {
    this._level = level;
    this._transportMgr = transportMgr;
    this._sid = context.sid;
    this._reqId = context.reqId;
    this._pkg = context.pkgs.join(context.pkgSep);
    this._meetsThreshold = thresholds.meetsThreshold;
    this._meetsFlushThreshold = thresholds.meetsFlushThreshold;
    this._flushCallback = flushCallback;
    this._demark = demark;
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
    return this._meetsThreshold;
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
    return this._meetsThreshold;
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
    return this._meetsThreshold;
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
    return this._demark ? this._demark(name, keep) : 0;
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
   * 1. Checks if the message meets the threshold requirements
   * 2. Creates a complete Log.Entry with context information
   * 3. Emits directly to the transport manager
   * 4. Triggers flush callback if flush threshold is met
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
    if (this._meetsThreshold) {
      const entry: Log.Entry = {
        level: this._level,
        timestamp: data.timestamp,
        sid: this._sid,
        reqId: this._reqId,
        pkg: this._pkg,
        msg: data.formatter,
        data: data.data,
      };

      // Emit directly to transport manager, bypassing LogMgr
      this._transportMgr.emit(entry);

      // If this message meets flush threshold, trigger flush
      if (this._meetsFlushThreshold && this._flushCallback) {
        this._flushCallback();
      }
    }

    return data;
  };
}
