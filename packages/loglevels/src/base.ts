import type { Integer } from '@epdoc/type';
import { isLogLevelSpec, isLogLevelsSet } from './guards.ts';
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
  protected _levelDef: Level.LogLevelMap;
  protected _increasing = false;
  protected _levelValues: Level.Value[];
  readonly defaultLevelName: Level.Name;
  readonly lowestLevelName: Level.Name;
  readonly warnLevelName: Level.Name;
  /**
   * Creates an instance of `LogLevels`.
   *
   * @param {Level.LogLevelMap} levelDef - An object defining the custom log levels.
   */
  constructor(levelDef: Level.LogLevelsSet) {
    if (!isLogLevelsSet(levelDef)) {
      throw new Error('Invalid LogLevelsSet definition');
    }
    const _levelDef = levelDef.levels;
    this.$$id = levelDef.id;

    // Convert all keys to uppercase for case-insensitive lookups.
    this._levelDef = Object.fromEntries(
      Object.entries(_levelDef).map(([key, value]) => [key.toUpperCase(), value]),
    );

    // Create a list of all numeric level values.
    const levelNames: Level.Name[] = Object.keys(this._levelDef);
    this._levelValues = levelNames.map((key) => {
      return this._levelDef[key] ? this._levelDef[key].val : 0;
    });

    this.defaultLevelName = this.#findLevel('default') || 'INFO';
    this.lowestLevelName = this.#findLevel('lowest') || 'INFO';
    this.warnLevelName = this.#findLevel('warn') || 'WARN';

    // Check if the level values are in increasing or decreasing order.
    // If the default level is lower than the lowest level, then the levels are decreasing.
    // Otherwise, they are increasing.
    if (this.warnLevelName && this.lowestLevelName) {
      this._increasing = this._levelDef[this.warnLevelName].val >= this._levelDef[this.lowestLevelName].val;
    } else {
      this._increasing = true; // Default to increasing if not enough info
    }
  }

  /**
   * @inheritdoc
   */
  #findLevel(what: 'default' | 'lowest' | 'warn' | 'flush'): Level.Name | undefined {
    const level = Object.keys(this._levelDef).find(
      (key) => (this._levelDef[key] as Level.LogLevelSpec)[what] === true,
    );
    return level;
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
  get levelDefs(): Level.LogLevelMap {
    return this._levelDef;
  }

  /**
   * @inheritdoc
   */
  asValue(level: Level.Name | Level.Value): Level.Value {
    if (typeof level === 'string' && isLogLevelSpec(this._levelDef[level.toUpperCase()])) {
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
      return isLogLevelSpec(this._levelDef[key]) && this._levelDef[key].val === level;
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
    return isLogLevelSpec(this._levelDef[levelName]) && this._levelDef[levelName].flush === true;
  }

  /**
   * @inheritdoc
   */
  maxWidth(threshold: Level.Value | Level.Name): Integer {
    const thresholdVal = this.asValue(threshold);
    let w = 0;
    for (const name of this.names) {
      const levelVal = this.asValue(name);
      if (this.meetsThresholdValue(levelVal, thresholdVal)) {
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
    if (isLogLevelSpec(this._levelDef[level])) {
      const colorFn = this._levelDef[level].fmtFn;
      if (colorFn) {
        return colorFn(msg);
      }
    }
    return msg;
  }
}
