import type { Integer } from '@epdoc/type';
import type { IBasic } from './ibasic.ts';
import type * as Level from './types.ts';

/**
 * @fileoverview This module provides a base implementation of log levels that
 * can be used to create custom log levels. By passing a LogLevelsDef object to
 * the constructor, a LogLevels object is created.
 */

/** Type guard for LogLevelDef */
export function isLogLevelDef(levelDef: unknown): levelDef is Level.LogLevelDef {
  return typeof levelDef === 'object' && levelDef !== null;
}

/**
 * Class representing the log levels that are to be used with the
 * {@linkcode Logger}. Allows for custom log levels to be defined. However in
 * order for these classes to be availalbe as Logger methods, you must subclass
 * the Logger class and add your methods to your subclasses.
 */
export class LogLevels implements IBasic {
  protected _levelDef: Level.LogLevelsDef;
  protected _increasing: boolean = false;
  protected _levelValues: Level.Value[];

  /**
   * Creates an instance of LogLevels.
   * @param levelDef - Optional custom log level definitions.
   */
  constructor(levelDef: Level.LogLevelsDef) {
    const _levelDef: Level.LogLevelsDef = levelDef as Level.LogLevelsDef;

    // Convert all keys to uppercase
    this._levelDef = Object.fromEntries(
      Object.entries(_levelDef).map(([key, value]) => [key.toUpperCase(), value])
    );

    // Create a list of level values
    const levelNames: Level.Name[] = Object.keys(this._levelDef);
    this._levelValues = levelNames.map((key) => {
      return this._levelDef[key] ? this._levelDef[key].val : 0;
    });

    // Check if the levels are increasing. Use more lines than necessary to calm
    // down the type checker.
    if (levelNames.length > 1) {
      const firstLevel: Level.Name = levelNames[0] as Level.Name;
      const lastLevel: Level.Name = levelNames[levelNames.length - 1] as Level.Name;
      this._increasing =
        // @ts-ignore ts should just stop whinging
        this._levelDef[firstLevel].val < this._levelDef[lastLevel].val;
    }
  }

  /**
   * The default log level name to use when one is not specified. This may vary
   * depending on the LogLevelDef, but usually it will be "INFO".
   * @returns The default log level name.
   */
  get defaultLevelName(): Level.Name {
    const defaultLevel = Object.keys(this._levelDef).find(
      (key) => (this._levelDef[key] as Level.LogLevelDef).default === true
    );
    if (defaultLevel) {
      return defaultLevel;
    }
    return 'INFO';
  }

  get lowestLevelName(): Level.Name {
    const defaultLevel = Object.keys(this._levelDef).find(
      (key) => (this._levelDef[key] as Level.LogLevelDef).lowest === true
    );
    if (defaultLevel) {
      return defaultLevel;
    }
    return 'INFO';
  }

  /**
   * Retrieves the names of all log levels.
   * @returns An array of log level names.
   */
  get names(): Level.Name[] {
    return Object.keys(this._levelDef);
  }

  /**
   * Retrieves the log level definitions.
   * @returns The log level definitions.
   */
  get levelDefs(): Level.LogLevelsDef {
    return this._levelDef;
  }

  /**
   * Retrieves the numeric log level by its associated name. If the level name
   * is not found, it throws an error. Additionally, it supports handling user
   * input by taking a numeric log level and returning itself, assuming it is a
   * valid value.
   *
   * @param level - The log level to retrieve. This can be either a LevelName
   * (string) or a LogLevel (number).
   * @returns The numeric log level associated with the given name or the
   * numeric log level itself if it is a valid value.
   * @throws Error - If the level name is not found or the numeric log level is
   * not valid.
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
   * Retrieves the name of the log level associated with a numeric value or
   * returns the level name itself if valid.
   *
   * @param level - The log level to retrieve (LogLevel or LevelName).
   * @returns The name of the log level associated with the given numeric value.
   * @throws Error - If the level name is not found or the numeric log level is
   * not valid.
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
   * Checks if a log level is above a specified threshold.
   * @param level - The log level to check.
   * @param threshold - The threshold to compare against.
   * @returns True if the log level is above the threshold, false otherwise.
   */
  meetsThreshold(level: Level.Value | Level.Name, threshold: Level.Value | Level.Name): boolean {
    return this.meetsThresholdValue(this.asValue(level), this.asValue(threshold));
  }

  meetsThresholdValue(levelVal: Level.Value, thresholdVal: Level.Value): boolean {
    if (this._increasing) {
      return levelVal <= thresholdVal;
    }
    return levelVal >= thresholdVal;
  }

  /**
   * Checks if a log level should result in a flush.
   * @param level - The log level to check.
   * @returns True if the log level is above the threshold, false otherwise.
   */
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean {
    const levelName = this.asName(level);
    return isLogLevelDef(this._levelDef[levelName]) && this._levelDef[levelName].flush === true;
  }

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
   * Applies color formatting, if any, to a log message based on its level.
   * @param msg - The message to format.
   * @param level - The log level associated with the message.
   * @returns The formatted message with color applied.
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
