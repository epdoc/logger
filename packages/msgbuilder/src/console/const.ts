import * as colors from '@std/fmt/colors';
import type { IEmitter, StyleFormatterFn } from '../types.ts';
import { ConsoleMsgBuilder } from './builder.ts';

/**
 * A record of style formatters for console messages.
 * Each key corresponds to a style, and the value is a function that applies the style to a string.
 */

export const consoleStyleFormatters: Record<string, StyleFormatterFn> = {
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
  /*   _reqId: colors.brightYellow,
  _sid: (str: string) => colors.underline(colors.yellow(str)),
  _package: colors.green,
  _action: colors.blue,
  _plain: colors.white,
  _suffix: colors.white,
  _elapsed: colors.white,
  _level: colors.gray,
  _source: colors.gray,
  _errorPrefix: colors.red,
  _warnPrefix: colors.cyan,
  _infoPrefix: colors.gray,
  _verbosePrefix: colors.gray,
  _debugPrefix: colors.gray,
  _sillyPrefix: colors.gray,
  _httpPrefix: colors.gray,
  _timePrefix: colors.gray,
 */
} as const;

export const consoleStyleFormattersV1: Record<string, StyleFormatterFn> = {
  text: colors.brightWhite,
  h1: (str: string) => colors.bold(colors.magenta(str)),
  h2: colors.magenta,
  h3: colors.yellow,
  action: (str: string) => colors.black(colors.bgYellow(str)),
  label: colors.blue,
  highlight: colors.brightMagenta,
  value: colors.green,
  path: (str: string) => colors.underline(colors.gray(str)),
  date: colors.brightCyan,
  warn: colors.brightYellow,
  error: (str: string) => colors.bold(colors.brightRed(str)),
  strikethru: colors.inverse,
  /*   _reqId: colors.brightYellow,
  _sid: (str: string) => colors.underline(colors.yellow(str)),
  _package: colors.green,
  _action: colors.blue,
  _plain: colors.white,
  _suffix: colors.white,
  _elapsed: colors.white,
  _level: colors.gray,
  _source: colors.gray,
  _errorPrefix: colors.red,
  _warnPrefix: colors.cyan,
  _infoPrefix: colors.gray,
  _verbosePrefix: colors.gray,
  _debugPrefix: colors.gray,
  _sillyPrefix: colors.gray,
  _httpPrefix: colors.gray,
  _timePrefix: colors.gray,
 */
} as const;

/**
 * A factory method for creating a new `ConsoleMsgBuilder` instance.
 * @param {IEmitter} emitter - The emitter to be used by the message builder.
 * @returns {ConsoleMsgBuilder} A new `ConsoleMsgBuilder` instance.
 */
export function createConsoleMsgBuilder(emitter: IEmitter): ConsoleMsgBuilder {
  return new ConsoleMsgBuilder(emitter);
}

/**
 * A factory method for creating a new `ConsoleMsgBuilder` instance with full parameters.
 * This is the factory method expected by the logger system.
 * @param {IEmitter} emitter - The emitter to be used when emitting the actual message.
 * @returns {ConsoleMsgBuilder} A new `ConsoleMsgBuilder` instance.
 */
export function createMsgBuilder(emitter: IEmitter): ConsoleMsgBuilder {
  return new ConsoleMsgBuilder(emitter);
}
