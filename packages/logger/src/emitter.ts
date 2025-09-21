import type * as Level from '$level';
import type * as Log from '$log';
import type * as MsgBuilder from '$msgbuilder';
import type * as Transport from '$transport';

/**
 * A lightweight emitter that captures logger context and directly emits
 * to the transport manager, bypassing the logger and log manager.
 *
 * This class is created by the LogMgr when a logger requests a message builder,
 * and it holds the necessary context (level, sid, reqIds, pkgs) along with
 * a direct reference to the TransportMgr.
 *
 * This implementation decouples the MsgBuilder from the Logger, simplifying
 * the emit flow from:
 * MsgBuilder.emit() -> Logger.emit() -> LogMgr.emit() -> TransportMgr.emit() -> Transport.emit()
 *
 * To:
 * MsgBuilder.emit() -> Emitter.emit() -> TransportMgr.emit() -> Transport.emit()
 */
export class Emitter implements MsgBuilder.IEmitter {
  private readonly _level: Level.Name;
  private readonly _transportMgr: Transport.Mgr;
  private readonly _sid?: string;
  private readonly _reqIds: string[];
  private readonly _pkgs: string[];
  private readonly _meetsThreshold: boolean;
  private readonly _meetsFlushThreshold: boolean;
  private readonly _flushCallback?: () => void;
  private readonly _demark?: (name: string, keep?: boolean) => number;

  constructor(
    level: Level.Name,
    transportMgr: Transport.Mgr,
    context: {
      sid?: string;
      reqIds: string[];
      pkgs: string[];
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
    this._reqIds = [...context.reqIds];
    this._pkgs = [...context.pkgs];
    this._meetsThreshold = thresholds.meetsThreshold;
    this._meetsFlushThreshold = thresholds.meetsFlushThreshold;
    this._flushCallback = flushCallback;
    this._demark = demark;
  }

  get dataEnabled(): boolean {
    return this._meetsThreshold;
  }

  get emitEnabled(): boolean {
    return this._meetsThreshold;
  }

  get stackEnabled(): boolean {
    return this._meetsThreshold;
  }

  /**
   * Measures the time elapsed since a performance mark was created.
   * @param {string} name - The name of the mark to measure.
   * @param {boolean} [keep=false] - If true, the mark is not removed after measurement.
   * @returns {number} The elapsed time in milliseconds.
   */
  demark(name: string, keep = false): number {
    return this._demark ? this._demark(name, keep) : 0;
  }

  /**
   * Emits the message data directly to the transport manager.
   * Creates a Log.Entry from the MsgBuilder.EmitterData and forwards it.
   */
  emit = (data: MsgBuilder.EmitterData): MsgBuilder.EmitterData => {
    if (this._meetsThreshold) {
      const entry: Log.Entry = {
        level: this._level,
        timestamp: data.timestamp,
        sid: this._sid,
        reqIds: this._reqIds.length > 0 ? [...this._reqIds] : undefined,
        pkgs: this._pkgs.length > 0 ? [...this._pkgs] : undefined,
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
