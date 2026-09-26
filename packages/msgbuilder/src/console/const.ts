import { palette } from '@epdoc/colors';
import * as colors from '@std/fmt/colors';
import { bold, rgb24 } from '@std/fmt/colors';
import type { IEmitter, QuoteTheme, StyleFormatterFn } from '../types.ts';
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

/**
 * Blends a 24-bit RGB color toward white to produce a subdued pastel tone.
 *
 * @param {number} rgb - The base color as a 24-bit RGB integer (e.g. `0xef4444`).
 * @param {number} [mix=0.45] - How far to blend toward white (0 = base, 1 = white).
 * @returns {StyleFormatterFn} A style formatter that renders text in the pastel tone.
 */
function pastel(rgb: number, mix = 0.45): StyleFormatterFn {
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const lighten = (c: number) => Math.round(c + (255 - c) * mix);
  const mixed = (lighten(r) << 16) | (lighten(g) << 8) | lighten(b);
  return (str: string) => rgb24(str, mixed);
}

/**
 * The default quote theme: a cycle of subdued, pastel colors.
 *
 * Adjacent entries are deliberately contrasting hues rather than a smooth
 * rainbow gradient, so nested bars remain easy to tell apart. Colors are
 * indexed by quote depth and wrap around.
 */
export const rainbowQuoteTheme: QuoteTheme = {
  line: 'medium',
  width: 1,
  palette: [
    pastel(0xef4444), // red
    pastel(0x60a5fa), // blue
    pastel(0x51d67c), // green
    pastel(0xf0883e), // orange
    pastel(0xa78bfa), // violet
    pastel(0xfbbf24), // yellow
    pastel(0x2dd4a8), // teal
    pastel(0xfb7185), // rose
    pastel(0x58d1eb), // cyan
  ],
};

/**
 * A monochrome quote theme that renders every level dimmed.
 */
export const monoQuoteTheme: QuoteTheme = {
  line: 'medium',
  width: 1,
  palette: [colors.dim],
};
