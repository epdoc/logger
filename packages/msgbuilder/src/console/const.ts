import { palette } from '@epdoc/colors';
import * as colors from '@std/fmt/colors';
import { bold, rgb24 } from '@std/fmt/colors';
import type { IEmitter } from '../types.ts';
import { ConsoleMsgBuilder } from './builder.ts';
import type { ConsoleStyleMap } from './types.ts';

/**
 * The original (V0) console style theme.
 *
 * Uses standard ANSI colors for broad terminal compatibility. All keys from
 * {@link ConsoleStyleMap} are defined here; the TypeScript compiler will report
 * an error if any are missing.
 */
export const consoleStyleFormattersV0: ConsoleStyleMap = {
  text: colors.white,
  h1: colors.brightWhite,
  h2: colors.magenta,
  h3: colors.yellow,
  action: (str: string) => colors.black(colors.bgYellow(str)),
  label: colors.gray,
  highlight: colors.brightMagenta,
  value: colors.brightGreen,
  url: colors.cyan,
  path: colors.cyan,
  code: colors.brightWhite,
  date: colors.brightCyan,
  warn: colors.yellow,
  error: colors.red,
  success: colors.brightGreen,
  strikethru: colors.inverse,
  dim: (str: string) => colors.dim(colors.white(str)),
  bold: (str: string) => colors.bold(colors.white(str)),
};

/**
 * An alternate console style theme (V1) with a higher-contrast, bolder palette.
 */
export const consoleStyleFormattersV1: ConsoleStyleMap = {
  text: colors.brightWhite,
  h1: (str: string) => bold(colors.magenta(str)),
  h2: colors.magenta,
  h3: colors.yellow,
  action: (str: string) => colors.black(colors.bgYellow(str)),
  label: colors.blue,
  highlight: colors.brightMagenta,
  value: colors.green,
  url: colors.cyan,
  path: (str: string) => colors.underline(colors.gray(str)),
  code: colors.brightWhite,
  date: colors.brightCyan,
  warn: colors.brightYellow,
  error: (str: string) => bold(colors.brightRed(str)),
  success: colors.brightGreen,
  strikethru: colors.inverse,
  dim: (str: string) => colors.dim(colors.white(str)),
  bold: (str: string) => colors.bold(colors.white(str)),
};

const { white, gold, amber, orange, pink, green, teal, cyan, steel, lavender, lilac } = palette;

/**
 * The default console style theme using a rich 24-bit RGB color palette.
 *
 * Requires a terminal with true-color (24-bit) support.
 */
export const consoleStyleFormatters: ConsoleStyleMap = {
  // Text hierarchy
  text: (str: string) => rgb24(str, white),
  h1: (str: string) => bold(rgb24(str, gold)),
  h2: (str: string) => rgb24(str, lilac),
  h3: (str: string) => rgb24(str, steel),

  // Interactive elements
  action: (str: string) => bold(rgb24(str, orange)),
  highlight: (str: string) => bold(rgb24(str, amber)),

  // Key-value pairs
  label: (str: string) => rgb24(str, steel),
  value: (str: string) => rgb24(str, green),

  // Navigation
  url: (str: string) => colors.underline(rgb24(str, cyan)),
  path: (str: string) => colors.underline(rgb24(str, lavender)),

  // Status indicators
  success: (str: string) => rgb24(str, teal),
  warn: (str: string) => rgb24(str, amber),
  error: (str: string) => bold(rgb24(str, pink)),

  // Utility
  code: (str: string) => rgb24(str, lavender),
  date: (str: string) => rgb24(str, steel),
  strikethru: colors.inverse,
  dim: (str: string) => colors.dim(rgb24(str, white)),
  bold: (str: string) => colors.bold(rgb24(str, white)),
};

/**
 * A factory method for creating a new {@link ConsoleMsgBuilder} instance.
 * @param {IEmitter} emitter - The emitter to be used by the message builder.
 * @returns {ConsoleMsgBuilder} A new `ConsoleMsgBuilder` instance.
 */
export function createConsoleMsgBuilder(emitter: IEmitter): ConsoleMsgBuilder {
  return new ConsoleMsgBuilder(emitter);
}

/**
 * A factory method for creating a new {@link ConsoleMsgBuilder} instance.
 * This is the factory method expected by the logger system.
 * @param {IEmitter} emitter - The emitter to be used when emitting the actual message.
 * @returns {ConsoleMsgBuilder} A new `ConsoleMsgBuilder` instance.
 */
export function createMsgBuilder(emitter: IEmitter): ConsoleMsgBuilder {
  return new ConsoleMsgBuilder(emitter);
}
