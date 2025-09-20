import type { EmitterData, IEmitter } from './types.ts';

/**
 * An `IEmitter` implementation that outputs formatted log messages to the console.
 */
export class ConsoleEmitter implements IEmitter {
  /** @inheritdoc */
  public dataEnabled: boolean = true;
  /** @inheritdoc */
  public emitEnabled: boolean = true;
  /** @inheritdoc */
  public stackEnabled: boolean = false;

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

/**
 * An `IEmitter` implementation designed for testing purposes.
 *
 * @remarks
 * This emitter captures the formatted output in a public `output` property
 * instead of writing to a destination, allowing for easy inspection in tests.
 */
export class TestEmitter implements IEmitter {
  /** @inheritdoc */
  public dataEnabled: boolean = true;
  /** @inheritdoc */
  public emitEnabled: boolean = true;
  /** @inheritdoc */
  public stackEnabled: boolean = false;
  /**
   * An optional flag to control whether the output should be colored.
   */
  public color?: boolean;
  /**
   * Stores the formatted output of the last emitted message.
   */
  public output?: string;

  /**
   * Captures the formatted message in the `output` property.
   *
   * @param {EmitterData} msg - The log data to process.
   * @returns {EmitterData} The original log data.
   */
  public emit(msg: EmitterData): EmitterData {
    this.output = msg.formatter.format({ color: this.color });
    return msg;
  }
}
