/**
 * @module
 * Provides the `LogLevels` class, a foundational implementation for managing
 * a collection of custom log levels.
 */

import type { Integer } from '@epdoc/type';
import { isLogLevelDef } from './helpers.ts';
import type * as Level from './types.ts';

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
 * It automatically determines whether the numeric values of the levels are
 * ascending or descending and adjusts its comparison logic accordingly.
 *
 * @implements {Level.IBasic}
 */
export class LogLevels implements Level.IBasic {
  $$id: string;
  protected _levelDef: Level.LogLevelsDef;
  protected _increasing = false;
  protected _levelValues: Level.Value[];

  /**
   * Creates an instance of `LogLevels`.
   *
   * @param {Level.LogLevelsDef} levelDef - An object defining the custom log levels.
   */
  constructor(levelDef: Level.LogLevelsDef, id: string = 'LogLevels') {
    const _levelDef: Level.LogLevelsDef = levelDef as Level.LogLevelsDef;
    this.$$id = id;

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
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
   */
  get warnLevelName(): Level.Name {
    const level = Object.keys(this._levelDef).find(
      (key) => (this._levelDef[key] as Level.LogLevelDef).warn === true,
    );
    if (level) {
      return level;
    }
    return 'WARN';
  }

  /**
   * @inheritdoc
   */
  get names(): Level.Name[] {
    return Object.keys(this._levelDef);
  }

  /**
   * @inheritdoc
   */
  get levelDefs(): Level.LogLevelsDef {
    return this._levelDef;
  }

  /**
   * @inheritdoc
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
   * @inheritdoc
   */
  asName(level: Level.Value | Level.Name): Level.Name {
    if (typeof level === 'string' && level.toUpperCase() in this._levelDef) {
      return level.toUpperCase() as Level.Name;
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
   * @inheritdoc
   */
  meetsThreshold(level: Level.Value | Level.Name, threshold: Level.Value | Level.Name): boolean {
    return this.meetsThresholdValue(this.asValue(level), this.asValue(threshold));
  }

  /**
   * @inheritdoc
   */
  meetsThresholdValue(levelVal: Level.Value, thresholdVal: Level.Value): boolean {
    if (this._increasing) {
      return levelVal >= thresholdVal;
    }
    return levelVal <= thresholdVal;
  }

  /**
   * @inheritdoc
   */
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean {
    const levelName = this.asName(level);
    return isLogLevelDef(this._levelDef[levelName]) && this._levelDef[levelName].flush === true;
  }

  /**
   * @inheritdoc
   */
  maxWidth(threshold: Level.Value | Level.Name): Integer {
    const thresholdVal = this.asValue(threshold);
    let w = 0;
    for (const name of this.names) {
      const levelVal = this.asValue(name);
      if (this.meetsThresholdValue(thresholdVal, levelVal)) {
        const len = name.length;
        if (len > w) {
          w = len;
        }
      }
    }
    return w;
  }

  /**
   * @inheritdoc
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
