import { Console } from '@epdoc/msgbuilder';
import { ProgressLine } from '@epdoc/progress';
import * as Ctx from './context.ts';

export class ProgressMsgBuilder extends Console.Builder {
  #line: ProgressLine;

  start(): void {
    if (this.#progress) {
      this.#progress.start(this.#startMsg.format());
    } else {
      this.#startMsg.emit();
    }
  }

  stop(): Ctx.CustomMsgBuilder {
    if (this.#progress) {
      this.#stopMsg = new Ctx.CustomMsgBuilder();
    } else {
      this.#stopMsg = this.ctx.log.info;
    }
    return this.#stopMsg;
  }
}

export class ProgressMonitor extends Ctx.BaseClass {
  // #level: Integer;
  #m0?: string;
  #startMsg?: ProgressMsgBuilder;
  #stopMsg?: ProgressMsgBuilder;
  #progress?: ProgressLine;

  override get info(): ProgressMsgBuilder {
    const val = this.ctx.log.logLevels.asValue('info');
    if (this.ctx.log.meetsThreshold(val - 1)) {
      this.#startMsg = this.ctx.log.info;
    } else {
      this.#startMsg = new ProgressMsgBuilder();
      this.#progress = new ProgressLine();
    }
    this.#m0 = this.ctx.log.mark();
    return this.#startMsg;
  }

  start(): void {
    if (this.#progress) {
      this.#progress.start(this.#startMsg.format());
    } else {
      this.#startMsg.emit();
    }
  }

  stop(): Ctx.CustomMsgBuilder {
    if (this.#progress) {
      this.#stopMsg = new Ctx.CustomMsgBuilder();
    } else {
      this.#stopMsg = this.ctx.log.info;
    }
    return this.#stopMsg;
  }

  emit() {
    if (this.#progress) {
      this.#progress.stop(this.#stopMsg.format());
    } else {
      this.#stopMsg.emit();
    }
  }
}
