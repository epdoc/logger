import { _, type CompareResult, type Integer } from '@epdoc/type';
import { assert } from '@std/assert/assert';
import { isLogLevelSpec, isLogLevelsSet, isSeverityNumber, isSpec } from './guards.ts';
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
  protected _levelDef: Level.LogLevelMap = {};
  #specMap: Level.SpecMap = {};
  #specArray: Level.SpecArray = new Array(25).fill(null);
  protected _levelValues: Level.Severity[] = [];
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

    // Convert all keys to uppercase for case-insensitive lookups and build
    // _defMap and _defArray in a single pass.
    for (const [key, spec] of Object.entries(_levelDef)) {
      const name = key.toUpperCase();
      this._levelDef[name] = spec;
      this._levelValues.push(spec.severity);
      const def: Level.Spec = { name, ...spec };
      this.#specMap[name] = def;
      this.#specArray[spec.severity] = def;
    }
  }

  get defaultLevel(): Level.Spec {
    assert(this.#specArray[9]);
    return this.#specArray[9];
  }
  get warnLevel(): Level.Spec {
    assert(this.#specArray[13]);
    return this.#specArray[13];
  }
  get flushLevel(): Level.Spec {
    assert(this.#specArray[17]);
    return this.#specArray[17];
  }

  /**
   * @inheritdoc
   */
  get names(): Level.Name[] {
    return Object.keys(this.#specMap);
  }

  get specMap(): Level.SpecMap {
    return this.#specMap;
  }

  /**
   * @inheritdoc
   * @deprecarted
   */
  get levelDefs(): Level.LogLevelMap {
    return this._levelDef;
  }

  asSpec(level: Level.Spec | Level.Name | Level.Severity): Level.Spec | null {
    if (isSpec(level)) return level;
    if (isSeverityNumber(level)) {
      return this.#specArray[level];
    }
    if (_.isString(level)) {
      const spec = this.#specMap[level.toUpperCase()];
      return spec ? spec : null;
    }
    return null;
  }

  /**
   * @inheritdoc
   * @deprecated
   */
  asValue(level: Level.Spec | Level.Name | Level.Severity): Level.Severity {
    if (isSpec(level)) {
      return level.severity;
    }
    if (_.isString(level) && isLogLevelSpec(this._levelDef[level.toUpperCase()])) {
      return this._levelDef[level.toUpperCase()].severity as Level.Severity;
    }
    if (_.isInteger(level) && this._levelValues.includes(level)) {
      return level as Level.Severity;
    }
    throw new Error(`Cannot get log level: no name for level: ${level ? level : 'undefined'}`);
  }

  /**
   * @inheritdoc
   * @deprecated
   */
  asName(level: Level.Spec | Level.Severity | Level.Name): Level.Name {
    if (isSpec(level)) {
      return level.name;
    }
    if (typeof level === 'string' && level.toUpperCase() in this._levelDef) {
      return level.toUpperCase() as Level.Name;
    }
    const result: Level.Name = Object.keys(this._levelDef).find((key) => {
      return isLogLevelSpec(this._levelDef[key]) && this._levelDef[key].severity === level;
    }) as Level.Name;
    if (result) {
      return result;
    }
    throw new Error(`Cannot get log level: no name for level: ${level}`);
  }

  /**
   * @inheritdoc
   * @deprecated
   */
  meetsThreshold(
    level: Level.Spec | Level.Severity | Level.Name,
    threshold: Level.Spec | Level.Severity | Level.Name,
  ): boolean {
    return (this.compareThresholdValue(this.asValue(level), this.asValue(threshold)) >= 0) ? true : false;
  }

  /**
   * @inheritdoc
   * @deprecated
   */
  compareThreshold(
    level: Level.Spec | Level.Severity | Level.Name,
    threshold: Level.Spec | Level.Severity | Level.Name,
  ): CompareResult {
    return this.compareThresholdValue(this.asValue(level), this.asValue(threshold));
  }

  /**
   * @inheritdoc
   * @deprecated
   */
  compareThresholdValue(levelVal: Level.Severity, thresholdVal: Level.Severity): CompareResult {
    return (levelVal > thresholdVal) ? +1 : (levelVal === thresholdVal) ? 0 : -1;
  }

  /**
   * @inheritdoc
   */
  compareLevels(level: Level.Spec, threshold: Level.Spec): CompareResult {
    return this.compareThresholdValue(level.severity, threshold.severity);
  }

  /**
   * @inheritdoc
   *     @deprecated
   */
  meetsFlushThreshold(level: Level.Spec | Level.Severity | Level.Name): boolean {
    const spec = this.asSpec(level);
    return (spec && spec.severity >= 17) ? true : false;
  }

  /**
   * @inheritdoc
   */
  maxWidth(threshold: Level.Spec | Level.Severity | Level.Name): Integer {
    const thresholdVal = this.asValue(threshold);
    let w = 0;
    for (const name of this.names) {
      const levelVal = this.asValue(name);
      if (this.compareThresholdValue(levelVal, thresholdVal) >= 0) {
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
