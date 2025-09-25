import * as colors from '@std/fmt/colors';
import type * as Console from './types.ts';

/**
 * A record of style formatters for the columns for console messages.
 * Each key corresponds to a style, and the value is a function that applies the style to a string.
 */
export const consoleStyleFormatters: Console.StyleFormatterMap = {
  _reqId: colors.brightYellow,
  _sid: (str: string) => colors.underline(colors.yellow(str)),
  _package: colors.green,
  _action: colors.blue,
  _plain: colors.white,
  _suffix: colors.white,
  _elapsed: colors.gray,
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
