import { getTerminalSize } from '@epdoc/terminal/screen';
import type { Integer } from '@epdoc/type';
import * as Console from './console/mod.ts';
/**
 * Utility for building multi-line formatted text blocks using MsgBuilder.
 *
 * Useful for accumulating multiple lines of formatted CLI messages before
 * rendering or logging them as a single block.
 *
 * @template M - The specific MsgBuilder subclass type
 *
 * @example
 * ```typescript
 * const tb = new TextBuilder(CustomMsgBuilder);
 * tb.line.text('Hello').value('world');
 * tb.newline();
 * tb.line.plain('Done');
 * console.log(tb.emit());
 * ```
 */
export class TextBuilder<M extends Console.Builder = Console.Builder> {
  lines: (string | M)[] = [];
  private builderClass: new () => M;
  private _indent: string[] = [];
  /** A hard ceiling set by {@link width}, in columns. */
  private _width: Integer | undefined;
  /** A ceiling set by {@link maxWidth}, capped by the terminal when rendering. */
  private _maxWidth: Integer | undefined;
  /** The `wrap(n)` waiting for the next line; it applies to that line only. */
  private _wrap = 0;

  constructor(builderClass?: new () => M) {
    this.builderClass = builderClass ?? (Console.Builder as unknown as new () => M);
  }

  /**
   * Add one or more levels of indentation.
   *
   * @param {number | string} [n] - If a string, it is added directly as an indentation.
   *                                If a number, that many 2-space indents are added.
   *                                If omitted, a single 2-space indent is added.
   */
  indent(n?: number | string): this {
    if (typeof n === 'string') {
      this._indent.push(n);
    } else {
      const count = typeof n === 'number' ? n : 1;
      for (let i = 0; i < count; i++) {
        this._indent.push('  ');
      }
    }
    return this;
  }

  /**
   * Remove one or more levels of indentation.
   *
   * @param {number} [n=1] - The number of indentation levels to remove.
   */
  outdent(n: number = 1): this {
    for (let i = 0; i < n; i++) {
      if (this._indent.length > 0) {
        this._indent.pop();
      }
    }
    return this;
  }

  /**
   * Reset all indentation levels.
   */
  nodent(): this {
    this._indent = [];
    return this;
  }

  /**
   * Create and append a new MsgBuilder line, pre-indented to the current indentation level.
   */
  get line(): M {
    const line = new this.builderClass();
    if (this._indent.length > 0) {
      const indentStr = this._indent.join('');
      // AbstractMsgBuilder joins parts with a space separator. To prevent an extra space,
      // we set the protected _msgIndent property and compensate by removing 1 space if it ends with a space.
      const msgIndent = indentStr.endsWith(' ') ? indentStr.slice(0, -1) : indentStr;
      (line as unknown as { _msgIndent: string })._msgIndent = msgIndent;
    }
    const wrapIndent = this._wrap;
    this._wrap = 0;
    if (wrapable(line)) {
      // The line carries its own wrap(n); a width set on the block applies to
      // every line, so the two are combined here and nowhere else.
      if (wrapIndent > 0) {
        line.wrap(wrapIndent);
      }
      const width = this.renderWidth();
      if (width !== undefined) {
        line.setWrap({ width, indent: wrapIndent });
      }
    }
    this.lines.push(line);
    return line;
  }

  /**
   * Indent every row after the first on the *next* line by `n` columns.
   *
   * The value belongs to that one line and is consumed when the line is taken,
   * so `tb.wrap(16)` followed by two `tb.line`s affects only the first. It needs
   * a width ({@link width} or {@link maxWidth}) to take effect; without one there
   * is nothing to wrap.
   *
   * @param {Integer} [n] - Columns of extra indentation for continuation rows.
   * @returns This builder, for chaining.
   *
   * @example
   * ```typescript
   * tb.maxWidth();
   * tb.wrap(16);
   * tb.line.text('Doorbell').code('amzn_sfx_doorbell_chime_01').text('plays on every Echo.');
   * // Rows after the first start 16 columns in, plus any indent().
   * ```
   */
  wrap(n: Integer = 0): this {
    this._wrap = Number.isInteger(n) && n > 0 ? n : 0;
    return this;
  }

  /**
   * Wrap this text block to a width, in columns.
   *
   * Nothing wraps until a width is set: without one, a line is as long as its
   * parts make it, which is what every existing caller relies on.
   *
   * @param {Integer} [n] - Total columns a row may occupy, the line's own indent
   *                        included. Omit it, or pass 0, to clear this ceiling;
   *                        `maxWidth()` may still apply. Use {@link noWrap} to turn
   *                        wrapping off completely.
   * @returns This builder, for chaining.
   *
   * @example
   * ```typescript
   * const tb = new TextBuilder(CustomMsgBuilder);
   * tb.maxWidth(); // A terminal that is 80 columns wide wraps at 80
   * tb.line.text('A sentence that is much longer than eighty columns once it is written out in full.');
   * ```
   */
  width(n?: Integer): this {
    this._width = isColumnCount(n) ? n : undefined;
    return this;
  }

  /**
   * Turn wrapping off entirely, clearing both {@link width} and {@link maxWidth}.
   *
   * @returns This builder, for chaining.
   */
  noWrap(): this {
    this._width = undefined;
    this._maxWidth = undefined;
    return this;
  }

  /**
   * Wrap this text block to the narrower of `n` and the terminal.
   *
   * Unlike {@link width}, which is a hard ceiling, this follows the terminal: a
   * 120-column ceiling on a 200-column terminal still wraps at 120, but on an
   * 80-column terminal it wraps at 80. Outside a TTY the terminal reports 80
   * columns, so piped output wraps at that.
   *
   * @param {Integer} [n] - A ceiling in columns. Omit it, or pass 0, to wrap at
   *                        the terminal width alone; `maxWidth(0)` also clears it.
   *                        Wrapping is turned off with {@link noWrap}.
   * @returns This builder, for chaining.
   */
  maxWidth(n?: Integer): this {
    // Unlike `width()`, no argument is not "off": it means "follow the
    // terminal", which is the common case. `noWrap()` turns wrapping off.
    this._maxWidth = n === 0 ? undefined : (isColumnCount(n) ? n : 0);
    return this;
  }

  /**
   * Append an empty line.
   */
  nl(): this {
    this.lines.push('');
    return this;
  }

  /**
   * Append an empty line.
   */
  newline(): this {
    this.lines.push('');
    return this;
  }

  /**
   * Format all lines and join them with newlines.
   */
  emit(): string {
    return this.toLines().join('\n');
  }

  toLines(): string[] {
    return this.lines
      .map((line) => typeof line === 'string' ? line : line.format());
  }

  /**
   * Convert the lines to a formatted string.
   */
  toString(): string {
    return this.toLines().join('\n');
  }

  /**
   * The width every line is wrapped to, or `undefined` when wrapping is off.
   *
   * The terminal is asked only when {@link maxWidth} is in force, so a plain
   * `width()` call never touches it.
   */
  private renderWidth(): Integer | undefined {
    if (this._maxWidth !== undefined) {
      const terminal = getTerminalSize().columns;
      return this._maxWidth === 0 ? terminal : Math.min(this._maxWidth, terminal);
    }
    return this._width;
  }
}

/** A usable column count: a positive integer. `0` and anything odd means "off". */
function isColumnCount(n: unknown): n is Integer {
  return typeof n === 'number' && Number.isInteger(n) && n > 0;
}

/** True for the builders that know how to wrap, i.e. those that carry a width. */
function wrapable(
  builder: unknown,
): builder is { setWrap: (opts: { width: number; indent: number } | undefined) => unknown } {
  return typeof (builder as { setWrap?: unknown }).setWrap === 'function';
}
