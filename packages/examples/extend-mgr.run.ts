#!/usr/bin/env -S deno run -A
import * as Log from '$logger';
import type * as MsgBuilder from '$msgbuilder';
import { createCustomMsgBuilder, type CustomMsgBuilder } from './lib/builder.ts';

/**
 * This example demonstrates how to subclass Log.Mgr to configure it with a
 * custom message builder and the non-default CliLogger.
 */

const filename = new URL(import.meta.url).pathname.split('/').pop();

type M = CustomMsgBuilder;
type L = Log.Cli.Logger<M>;

export class LogMgr extends Log.Mgr<M> {
  constructor(opts: Log.IMgrSettings = {}) {
    super();
    this._show = Object.assign({
      level: true,
      timestamp: 'elapsed',
      pkg: true,
      sid: true,
      reqId: true,
    }, opts.show ? opts.show : {});
    this._loggerFactories = Log.Cli.factoryMethods;
    this.msgBuilderFactory = createCustomMsgBuilder;
  }

  override init(): this {
    super.init();
    this.threshold = 'info';
    return this;
  }
}

const logMgr = new LogMgr().init();
const log = logMgr.getLogger<L>();

// --- Example Usage ---
log.info.section(`Begin ${filename}`).emit();

// A simple log message.
log.info.h2('Hello world').emit();

// You can also create a message builder instance and use it multiple times.
const line: MsgBuilder.Console.Builder = log.silly;
line.h2('A silly level hello again');
line.emit();

// A more complex log message with different styles.
log.info.h1('Output').value('my value').h2('to').path('/Users/me/myfiles').emit();

// An example of logging an error.
log.error.err(new Error('Simulation of something went wrong')).emit();

log.info.error('^^ You should have seen a stack trace above this line ^^').emit();
log.info.section(`End ${filename}`).emit();
