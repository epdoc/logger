/**
 * This example demonstrates how to create and use a custom message builder
 * to extend the functionality of the logger.
 */
import { asError } from '@epdoc/type';
import os from 'node:os';
import { Log } from '../mod.ts';

const _home = os.userInfo().homedir;

/**
 * A factory method that the Log.Mgr will use to create new instances of our
 * custom message builder.
 */
const createCustomMsgBuilder: Log.MsgBuilder.FactoryMethod = (
  level: Log.Level.Name,
  emitter: Log.Base.IEmitter,
  meetsThreshold: boolean,
) => {
  return new CustomMsgBuilder(level, emitter, meetsThreshold);
};

/**
 * A custom message builder that extends the built-in `Console` message builder
 * with new methods.
 */
export class CustomMsgBuilder extends Log.MsgBuilder.Console.Builder {
  constructor(
    level: Log.Level.Name,
    emitter: Log.Base.IEmitter,
    meetsThreshold: boolean,
  ) {
    super(level, emitter, meetsThreshold);
  }

  /**
   * A custom method to create a section header.
   *
   * NOTE: This method was created for this example before the `section()`
   * method was added to the core `@epdoc/logger` module. It is retained here
   * as a demonstration of how to extend the message builder.
   */
  customSection(str: string): this {
    const len = (80 - str.length) / 2;
    return this.h1('-'.repeat(Math.floor(len)))
      .h1(str)
      .h1('-'.repeat(Math.ceil(len)));
  }

  /**
   * A helper method for simple pluralization.
   */
  pl(num: number, singular: string, plural?: string): this {
    return this.value(num + ' ' + (num === 1 ? singular : plural ? plural : singular + 's'));
  }

  /**
   * A custom method for logging errors.
   *
   * NOTE: This method was created for this example before the `err()`
   * method was added to the core `@epdoc/logger` module. It is retained here
   * as a demonstration of how to extend the message builder.
   */
  errCustom(error: unknown, _stack = false): this {
    const err = asError(error);
    this.error(err.message);
    if (err.cause) {
      this.label('cause:').value(err.cause);
    }
    // if (stack && this.emitter.meetsThreshold('debug')) {
    //   this.text('\n' + err.stack);
    // }
    return this;
  }
}

// Create a new Log Manager instance that will use our custom message builder.
export const logMgr = new Log.Mgr<CustomMsgBuilder>();
// Register the factory method for the custom message builder.
logMgr.msgBuilderFactory = createCustomMsgBuilder;
// Configure the log output format.
logMgr.show = { level: true, timestamp: 'elapsed', reqId: true, sid: true, package: true };
// Set the logging threshold.
logMgr.threshold = 'info';
// Get a logger instance from the manager, casting it to use the custom builder type.
export const log = logMgr.getLogger<Log.Std.Logger<CustomMsgBuilder>>();

// --- Example Usage ---
log.info.section('Start log.ts').emit();

// A standard log message using the built-in methods.
log.info.h1('h1(header)').label('label(text)').emit();
// A log message using our custom `customSection` method.
log.info.customSection('heading').emit();
// A log message using our custom `errCustom` method.
log.info.errCustom(new Error('my error')).emit();
log.info.section('Finish').emit();
