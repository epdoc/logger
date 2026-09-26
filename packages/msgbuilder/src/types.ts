import type { DateTime } from '@epdoc/datetime';
import type { HrMilliseconds } from '@epdoc/duration';
import type { Dict, Integer, SemVerString } from '@epdoc/type';
import type { AbstractMsgBuilder } from './abstract.ts';

/**
 * Defines the interface for an emitter, which is responsible for outputting log messages.
 */
export interface IEmitter {
  /**
   * Indicates if data payloads are enabled for emission as part of the message string. An
   * application using a MsgBuilder may want to handle data at a higher level when emit is called.
   */
  dataEnabled: boolean;
  /**
   * Indicates if the emitter is globally enabled. This may depend on log level settings. For
   * example, if this message is associated with a message at a VERBOSE log level, but the log
   * reporting level is set to INFO, then none of this message will be output and the code can take
   * execution shortcuts.
   */
  emitEnabled: boolean;
  /**
   * Indicates if stack traces are to be emitted when there is an error being logged. This may
   * depend on log level settings, for example an application might elect to emit a stack trace only
   * when the log level is at DEBUG or lower.
   */
  stackEnabled: boolean;
  /**
   * Emits a log message.
   * @param {EmitterData} msg - The data to be emitted.
   * @returns {EmitterData} The emitted data.
   */
  emit: (msg: EmitterData) => EmitterData;
  /**
   * Measures the time elapsed since a performance mark was created.
   * @param {string} name - The name of the mark to measure.
   * @param {boolean} [keep=false] - If true, the mark is not removed after measurement.
   * @returns {number} The elapsed time in milliseconds.
   */
  demark?: (name: string, keep?: boolean) => number;
}

/**
 * Represents the data structure for a log message to be emitted.
 */
export type EmitterData = {
  /**
   * The timestamp of the log message.
   */
  timestamp: DateTime;
  /**
   * The formatter to be used for the log message.
   */
  formatter: IFormatter;
  /**
   * An optional data payload for the log message.
   */
  data: Dict | undefined;
  /**
   * An optional elapsed time to be displayed by transport as separate column.
   */
  elapsed: HrMilliseconds;
};

/**
 * Defines the possible targets for log message emission.
 * - `console`: Human-readable console output.
 * - `json`: Single JSON object.
 * - `jsonArray`: An array of JSON objects.
 */
export type EmitterTarget = 'console' | 'json' | 'jsonArray';

/**
 * Options for formatting a log message.
 */
export type FormatOpts = {
  /**
   * Whether to apply color styling to the output.
   */
  color?: boolean;
  /**
   * The target format for the output.
   */
  target?: EmitterTarget;
  /**
   * The number of spaces used to separate message parts. Defaults to 1.
   */
  msgSep?: Integer;
  /** If set then reset the MsgBuilder state, essentially setting it to a blank string once format
   * is called. Reasons to not do this are when there are multiple transports that all share the
   * same formatted string. */
  reset?: boolean;
};

/**
 * A function that applies styling to a string.
 * @param {string} str - The string to be styled.
 * @returns {string} The styled string.
 */
export type StyleFormatterFn = (str: string) => string;

/**
 * Represents the types of arguments that can be passed to styling methods.
 */
export type StyleArg = string | number | Record<string, unknown> | unknown[] | unknown;

/**
 * Represents a part of a log message with its content and style.
 */
export type MsgPart = {
  /**
   * The string content of the message part.
   */
  str: string;
  /**
   * The style formatter function to be applied to the string.
   */
  style?: StyleFormatterFn;
};

/**
 * A single indentation level applied to a message by a logger.
 *
 * Unlike a plain string, an indentation level can carry a style formatter so
 * that it renders correctly in both color and no-color output. This is the
 * building block for quoted (striped) indentation.
 */
export type IndentLevel = {
  /**
   * The indentation text (e.g. a quote bar glyph like `▌` or a run of spaces).
   */
  str: string;
  /**
   * Optional style formatter applied to the indentation text. When absent (or
   * when formatting with `color: false`), the text is rendered unstyled.
   */
  style?: StyleFormatterFn;
};

/**
 * Named vertical bar styles used for quoted (striped) indentation.
 *
 * The name is resolved to a glyph via {@link LINE_TYPES}.
 */
export type LineType = 'thin' | 'medium' | 'thick';

/**
 * Per-quote overrides for a single `quote()` call.
 *
 * All properties are optional and fall back to the active {@link QuoteTheme}
 * and then to built-in defaults.
 */
export type QuoteOpts = {
  /**
   * Number of columns the bar occupies. The glyph is repeated `width` times.
   */
  width?: number;
  /**
   * Named bar style, resolved to a glyph via {@link LINE_TYPES}. Ignored when
   * `char` is also provided.
   */
  line?: LineType;
  /**
   * An explicit bar glyph, taking precedence over `line` and the theme.
   */
  char?: string;
  /**
   * A style formatter for the bar, overriding the theme palette for this call.
   */
  style?: StyleFormatterFn;
};

/**
 * A themed quote configuration for quoted (striped) indentation.
 *
 * A quote level renders a bar glyph in the left gutter of each log line. The
 * `palette` is cycled by indentation depth so that nested levels render in
 * successive colors.
 */
export type QuoteTheme = {
  /**
   * The default bar glyph (e.g. `▌`, `│`, `┃`). Used when neither `line` nor a
   * per-call `char` is provided.
   */
  char?: string;
  /**
   * The default named bar style. Used when no per-call `line` or `char` is given.
   */
  line?: LineType;
  /**
   * The default bar width in columns. Defaults to 1.
   */
  width?: number;
  /**
   * Colors cycled by indentation depth. Each entry is applied to the bar glyph
   * at the matching depth.
   */
  palette: StyleFormatterFn[];
};

/**
 * Interface for formatting a log message.
 */
export interface IFormatter {
  /**
   * Formats the message based on the specified color and target format.
   * @param {boolean} color - Whether to apply color styling.
   * @param {Transport.OutputFormatType} target - The output format.
   * @returns {string} The formatted message string.
   */
  format(opts?: FormatOpts): string;
  /**
   * Appends a message part to the end of the message.
   * @param {string} str - The string content to append.
   * @param {StyleFormatterFn | null} [style] - The style to apply.
   * @returns {IFormatter} The current instance for method chaining.
   */
  appendMsgPart(str: string, style?: StyleFormatterFn | null): IFormatter;
  /**
   * Prepends a message part to the beginning of the message.
   * @param {string} str - The string content to prepend.
   * @param {StyleFormatterFn | null} [style] - The style to apply.
   * @returns {IFormatter} The current instance for method chaining.
   */
  prependMsgPart(str: string, style?: StyleFormatterFn | null): IFormatter;
  /**
   * Prepends a set of indentation levels to the beginning of the message.
   * @param {IndentLevel[]} levels - The indentation levels to prepend, in order.
   * @returns {IFormatter} The current instance for method chaining.
   */
  prependIndent(levels: IndentLevel[]): IFormatter;

  // demark(name:string,keep?: boolean) : HrMilliseconds
}

/**
 * A factory method for creating a message builder instance.
 * @param {string} level - The log level.
 * @param {IEmitter} emitter - The log emitter.
 * @param {boolean} meetsThreshold - Whether the log level meets the threshold.
 * @param {boolean} meetsFlushThreshold - Whether the log level meets the flush threshold.
 * @returns {AbstractMsgBuilder} A new message builder instance.
 */
export type FactoryMethod = (
  emitter: IEmitter,
) => AbstractMsgBuilder;

export type StyleMap = Record<string, StyleFormatterFn>;

export { type BoolFormatterOptions, type BoolPresetName } from '@epdoc/fmt';

export interface IVersion {
  version?: SemVerString;
}
