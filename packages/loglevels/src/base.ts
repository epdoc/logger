import type { Integer } from '@epdoc/type';
import { assert } from '@std/assert/assert';
import { isLogLevelsSet, isSeverityNumber, isSpec } from './guards.ts';
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
 * @implements {Level.IBasic}
 */
export class LogLevels implements Level.IBasic {
  $$id: string;
  #specMap: Level.SpecMap = new Map();
  #specArray: Level.SpecArray = new Array(25).fill(null);
  /**
   * Creates an instance of `LogLevels`.
   *
   * @param {Level.LogLevelsSet} levelDef - An object defining the custom log levels.
   */
  constructor(levelDef: Level.LogLevelsSet) {
    if (!isLogLevelsSet(levelDef)) {
      throw new Error('Invalid LogLevelsSet definition');
    }
    const _levelDef = levelDef.levels;
    this.$$id = levelDef.id;

    // Convert all keys to uppercase for case-insensitive lookups and build
    // specMap and specArray in a single pass.
    for (const [key, spec] of Object.entries(_levelDef)) {
      const name = key.toUpperCase();
      const def: Level.Spec = { name, ...spec };
      this.#specMap.set(name, def);
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

  get specMap(): Level.SpecMap {
    return this.#specMap;
  }

  get specArray(): Level.SpecArray {
    return this.#specArray;
  }

  /**
   * Converts a level name, severity number, or Spec to a full {@link Level.Spec}
   * object. Returns `null` if the level is not found.
   *
   * @param level - A level name (e.g. `'INFO'`), severity number (e.g. `9`),
   *   or an existing {@link Level.Spec}.
   * @returns The matching Spec, or `null` if not found.
   */
  asSpec(level: Level.Spec | Level.Name | Level.Severity): Level.Spec | null {
    if (isSpec(level)) return level;
    if (isSeverityNumber(level)) {
      return this.#specArray[level];
    }
    if (typeof level === 'string') {
      const spec = this.#specMap.get(level.toUpperCase());
      return spec ? spec : null;
    }
    return null;
  }

  /**
   * Calculates the maximum character width of all log level names at or above
   * the given threshold severity, for column-alignment in formatted output.
   *
   * @param thresholdSpec - Only levels with severity >= this spec's severity
   *   are considered.
   * @returns The maximum name width among qualifying levels.
   */
  maxWidth(thresholdSpec: Level.Spec): Integer {
    let w = 0;
    for (const spec of this.#specArray) {
      if (spec && spec.severity >= thresholdSpec.severity) {
        if (spec.name.length > w) {
          w = spec.name.length;
        }
      }
    }
    return w;
  }
}
