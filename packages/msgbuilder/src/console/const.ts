import * as colors from '@std/fmt/colors';
import type { IEmitter, StyleFormatterFn } from '../types.ts';
import { ConsoleMsgBuilder } from './builder.ts';

export const consoleStyleFormatters: Record<string, StyleFormatterFn> = {
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
  _reqId: colors.brightYellow,
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
} as const;

/**
 * A factory method for creating a new `Console` instance.
 * @returns {ConsoleMsgBuilder} A new `Console` instance.
 */
export function createConsoleMsgBuilder(emitter: IEmitter): ConsoleMsgBuilder {
  return new ConsoleMsgBuilder(emitter);
}
