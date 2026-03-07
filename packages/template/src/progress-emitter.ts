import type { EmitterData, IEmitter } from '@epdoc/msgbuilder';
import * as Log from '@epdoc/logger';

/**
 * An `IEmitter` implementation that outputs formatted log messages to the console.
 */
export class ProgressEmitter extends Log.Emitter {
  /**
   * Outputs the formatted message to the console.
   *
   * @param {EmitterData} msg - The log data to emit.
   * @returns {EmitterData} The original log data.
   */
  public emit(msg: EmitterData): EmitterData {
    console.log(msg.formatter.format());
    return msg;
  }
}
