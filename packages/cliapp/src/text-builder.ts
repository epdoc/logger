import { MsgBuilder } from './context.ts';

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
export class TextBuilder<M extends MsgBuilder = MsgBuilder> {
  lines: (string | M)[] = [];
  private builderClass: new () => M;

  constructor(builderClass?: new () => M) {
    this.builderClass = builderClass ?? (MsgBuilder as unknown as new () => M);
  }

  /**
   * Create and append a new MsgBuilder line.
   */
  get line(): M {
    const line = new this.builderClass();
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
    return this.lines
      .map((line) => typeof line === 'string' ? line : line.format())
      .join('\n');
  }

  /**
   * Convert the lines to a formatted string.
   */
  toString(): string {
    return this.emit();
  }
}
