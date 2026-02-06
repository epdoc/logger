/**
 * Simulates @epdoc/logger package
 */

import type { AbstractMsgBuilder } from './msgbuilder.ts';

export class LogMgr<M extends AbstractMsgBuilder> {
  getBuilder(): M {
    throw new Error("Not implemented");
  }
}

export abstract class AbstractLogger<M extends AbstractMsgBuilder> {
  abstract info: M;
  protected _logMgr!: LogMgr<M>;
  
  assign(logger: AbstractLogger<M>): void {
    this._logMgr = logger._logMgr;
  }
}

export class StdLogger<M extends AbstractMsgBuilder> extends AbstractLogger<M> {
  info: M;
  
  constructor(logMgr: LogMgr<M>, builder: M) {
    super();
    this._logMgr = logMgr;
    this.info = builder;
  }
}
