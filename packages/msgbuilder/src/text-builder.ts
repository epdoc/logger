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
    this.lines.push(line);
    return line;
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
}
