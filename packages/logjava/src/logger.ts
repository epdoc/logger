import type { IGetChildParams, Mgr as LogMgr } from '@epdoc/logger';
import { AbstractLogger as BaseLogger } from '@epdoc/logger';
import type * as MsgBuilder from '@epdoc/msgbuilder';

/**
 * Java-style logger implementation with standard Java log levels.
 *
 * @template M - The type of message builder used by the logger
 * @public
 */
export class JavaLogger<M extends MsgBuilder.Abstract> extends BaseLogger<M> {
  override copy(): this {
    const result = new (this.constructor as new (logMgr: LogMgr<M>, params?: IGetChildParams) => this)(this._logMgr);
    result.assign(this);
    return result;
  }

  public get severe(): M {
    return this._logMgr.getMsgBuilder('SEVERE', this);
  }

  public get warning(): M {
    return this._logMgr.getMsgBuilder('WARNING', this);
  }

  public get info(): M {
    return this._logMgr.getMsgBuilder('INFO', this);
  }

  public get config(): M {
    return this._logMgr.getMsgBuilder('CONFIG', this);
  }

  public get fine(): M {
    return this._logMgr.getMsgBuilder('FINE', this);
  }

  public get finer(): M {
    return this._logMgr.getMsgBuilder('FINER', this);
  }

  public get finest(): M {
    return this._logMgr.getMsgBuilder('FINEST', this);
  }
}
