import * as colors from '@std/fmt/colors';
import type { TransportStyleMap } from './types.ts';

/**
 * Default styles for formatting metadata columns in {@link ConsoleTransport}.
 *
 * These styles are applied to transport columns (e.g. session ID, request ID,
 * elapsed time) rather than the message content itself. All keys from
 * {@link TransportStyleMap} are defined here.
 *
 * Override on the transport class for custom theming:
 * ```ts
 * Console.Transport.columnStyles = myCustomStyles;
 * ```
 */
export const consoleStyleFormatters: TransportStyleMap = {
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
};
