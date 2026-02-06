/**
 * Simulates user application code
 */

import { ConsoleMsgBuilder } from './msgbuilder.ts';
import { StdLogger } from './logger.ts';
import { Context } from './context.ts';
import { BaseCommand } from './command.ts';

// AppBuilder extends ConsoleMsgBuilder
class AppBuilder extends ConsoleMsgBuilder {
  fileOp(op: string): this { return this; }
}

// RootContext uses DEFAULT (becomes Context<Console.Builder>)
class RootContext extends Context {}

// AppContext explicitly specifies AppBuilder
class AppContext extends Context<AppBuilder, StdLogger<AppBuilder>> {}

// TEST 1: RootContext
class TestCommandRoot extends BaseCommand<RootContext, RootContext> {
  test() {
    this.ctx.log.info.text("test");
  }
}

// TEST 2: AppContext - THIS SHOULD FAIL if we have the variance problem
class TestCommandApp extends BaseCommand<AppContext, AppContext> {
  test() {
    this.ctx.log.info.text("test");
  }
}

console.log("Test complete");
