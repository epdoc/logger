import type { Integer } from '@epdoc/type';
import { isLogLevelDef } from './helpers.ts';
import type * as Level from './types.ts';

/**
 * Provides a foundational implementation for managing a collection of log levels.
 *
 * @remarks
 * This module contains the `LogLevels` class, which is responsible for
 * interpreting a set of custom log level definitions. It provides the core logic
 * for converting between level names and their numeric values, checking if a log
 * message meets a given threshold, and handling level-specific formatting.
 *
 * @module
 */

/**
 * Manages a custom set of log levels, providing utilities for conversion,
 * comparison, and formatting.
 *
 * @remarks
 * This class is the engine that powers the logger's understanding of what
 * different log levels mean. It takes a definition of levels and provides the
 * necessary methods to work with them, such as checking if a `debug` message
 * should be logged when the threshold is `info`.
 *
 * It determines whether the numeric values of the levels are ascending or
 * descending and adjusts its comparison logic accordingly.
 */
export class LogLevels implements Level.IBasic {
  protected _levelDef: Level.LogLevelsDef;
  protected _increasing = false;
  protected _levelValues: Level.Value[];

  /**
   * Creates an instance of LogLevels.
   *
   * @param {Level.LogLevelsDef} levelDef - An object defining the custom log levels.
   */
  constructor(levelDef: Level.LogLevelsDef) {
    const _levelDef: Level.LogLevelsDef = levelDef as Level.LogLevelsDef;

    // Convert all keys to uppercase for case-insensitive lookups.
    this._levelDef = Object.fromEntries(
      Object.entries(_levelDef).map(([key, value]) => [key.toUpperCase(), value]),
    );

    // Create a list of all numeric level values.
    const levelNames: Level.Name[] = Object.keys(this._levelDef);
    this._levelValues = levelNames.map((key) => {
      return this._levelDef[key] ? this._levelDef[key].val : 0;
    });

    // Check if the level values are in increasing or decreasing order.
    if (levelNames.length > 1) {
      const firstLevel: Level.Name = levelNames[0] as Level.Name;
      const lastLevel: Level.Name = levelNames[levelNames.length - 1] as Level.Name;
      this._increasing =
        // @ts-ignore Trusting the structure of the level definition.
        this._levelDef[firstLevel].val < this._levelDef[lastLevel].val;
    }
  }

  /**
   * Gets the name of the default log level.
   *
   * @remarks
   * The default level is specified by setting `default: true` in the
   * {@link Level.LogLevelsDef}. Falls back to 'INFO' if not specified.
   */
  get defaultLevelName(): Level.Name {
    const defaultLevel = Object.keys(this._levelDef).find(
      (key) => (this._levelDef[key] as Level.LogLevelDef).default === true,
    );
    if (defaultLevel) {
      return defaultLevel;
    }
    return 'INFO';
  }

  /**
   * Gets the name of the lowest-priority log level.
   *
   * @remarks
   * The lowest level is specified by setting `lowest: true` in the
   * {@link Level.LogLevelsDef}. Falls back to 'INFO' if not specified.
   */
  get lowestLevelName(): Level.Name {
    const level = Object.keys(this._levelDef).find(
      (key) => (this._levelDef[key] as Level.LogLevelDef).lowest === true,
    );
    if (level) {
      return level;
    }
    return 'INFO';
  }

  /**
   * Gets the name of the warning log level.
   *
   * @remarks
   * The warning level is specified by setting `warn: true` in the
   * {@link Level.LogLevelsDef}. Falls back to 'WARN' if not specified.
   */
  get warnLevelName(): Level.Name {
    const level = Object.keys(this._levelDef).find(
      (key) => (this._levelDef[key] as Level.LogLevelDef).warn === true,
    );
    if (level) {
      return level;
    }
    return 'INFO';
  }

  /**
   * Retrieves the names of all defined log levels.
   */
  get names(): Level.Name[] {
    return Object.keys(this._levelDef);
  }

  /**
   * Retrieves the raw log level definition object.
   */
  get levelDefs(): Level.LogLevelsDef {
    return this._levelDef;
  }

  /**
   * Converts a log level name (string) or value (number) into its corresponding
   * numeric value.
   *
   * @param {Level.Name | Level.Value} level - The log level to convert.
   * @returns {Level.Value} The numeric value of the log level.
   * @throws {Error} If the level name or value is not defined.
   */
  asValue(level: Level.Name | Level.Value): Level.Value {
    if (typeof level === 'string' && isLogLevelDef(this._levelDef[level.toUpperCase()])) {
      return this._levelDef[level.toUpperCase()].val as Level.Value;
    }
    if (typeof level === 'number' && this._levelValues.includes(level)) {
      return level as Level.Value;
    }
    throw new Error(`Cannot get log level: no name for level: ${level}`);
  }

  /**
   * Converts a log level value (number) or name (string) into its corresponding
   * name.
   *
   * @param {Level.Value | Level.Name} level - The log level to convert.
   * @returns {Level.Name} The name of the log level.
   * @throws {Error} If the level value or name is not defined.
   */
  asName(level: Level.Value | Level.Name): Level.Name {
    if (level in this._levelDef) {
      return level as Level.Name;
    }
    const result: Level.Name = Object.keys(this._levelDef).find((key) => {
      return isLogLevelDef(this._levelDef[key]) && this._levelDef[key].val === level;
    }) as Level.Name;
    if (result) {
      return result;
    }
    throw new Error(`Cannot get log level: no name for level: ${level}`);
  }

  /**
   * Checks if a given log level meets or exceeds a specified threshold.
   *
   * @param {Level.Value | Level.Name} level - The log level to check.
   * @param {Level.Value | Level.Name} threshold - The threshold to compare against.
   * @returns {boolean} `true` if the log level meets the threshold.
   */
  meetsThreshold(level: Level.Value | Level.Name, threshold: Level.Value | Level.Name): boolean {
    return this.meetsThresholdValue(this.asValue(level), this.asValue(threshold));
  }

  /**
   * Performs the numeric comparison to check if a level meets a threshold.
   *
   * @param {Level.Value} levelVal - The numeric value of the log level.
   * @param {Level.Value} thresholdVal - The numeric value of the threshold.
   * @returns {boolean} `true` if the level meets the threshold.
   * @internal
   */
  meetsThresholdValue(levelVal: Level.Value, thresholdVal: Level.Value): boolean {
    if (this._increasing) {
      return levelVal <= thresholdVal;
    }
    return levelVal >= thresholdVal;
  }

  /**
   * Checks if a log level is configured to trigger an immediate flush of the
   * log buffer.
   *
   * @param {Level.Value | Level.Name} level - The log level to check.
   * @returns {boolean} `true` if the level is marked for flushing.
   */
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean {
    const levelName = this.asName(level);
    return isLogLevelDef(this._levelDef[levelName]) && this._levelDef[levelName].flush === true;
  }

  /**
   * Calculates the maximum character width of all log level names up to a given
   * threshold.
   *
   * @remarks
   * This is useful for aligning log output in a fixed-width format.
   *
   * @param {Level.Value | Level.Name} threshold - The highest log level to consider.
   * @returns {Integer} The maximum width of the level names.
   */
  maxWidth(threshold: Level.Value | Level.Name): Integer {
    const thresholdVal = this.asValue(threshold);
    let w = 0;
    for (let ldx = 0; ldx <= thresholdVal; ++ldx) {
      const len = this.asName(ldx).length;
      if (len > w) {
        w = len;
      }
    }
    return w;
  }

  /**
   * Applies a level-specific color formatting function to a message, if defined.
   *
   * @param {string} msg - The message to format.
   * @param {Level.Name} level - The log level of the message.
   * @returns {string} The formatted (potentially colored) message.
   */
  applyColors(msg: string, level: Level.Name): string {
    if (isLogLevelDef(this._levelDef[level])) {
      const colorFn = this._levelDef[level].fmtFn;
      if (colorFn) {
        return colorFn(msg);
      }
    }
    return msg;
  }
}
