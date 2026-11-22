import { assertEquals } from '@std/assert';
import { stripAnsi, visualLength } from '@epdoc/terminal/screen';
import { Console, TextBuilder } from '../src/mod.ts';
// import { MsgBuilder } from '../src/context.ts';

Deno.test('TextBuilder', async (t) => {
  await t.step('should format multiple lines with default MsgBuilder', () => {
    const tb = new TextBuilder();

    tb.line.plain('Line 1');
    tb.line.plain('Line 2');
    tb.newline();
    tb.line.plain('Line 3');

    const expected = 'Line 1\nLine 2\n\nLine 3';
    assertEquals(tb.emit(), expected);
    assertEquals(tb.toString(), expected);
  });

  await t.step('should format multiple lines with custom MsgBuilder class', () => {
    class CustomBuilder extends Console.Builder {
      custom(text: string) {
        return this.plain(`[CUSTOM] ${text}`);
      }
    }

    const tb = new TextBuilder(CustomBuilder);

    tb.line.custom('Line 1');
    tb.line.custom('Line 2');
    tb.nl();
    tb.line.custom('Line 3');

    const expected = '[CUSTOM] Line 1\n[CUSTOM] Line 2\n\n[CUSTOM] Line 3';
    assertEquals(tb.emit(), expected);
  });

  await t.step('should support indentation levels', () => {
    const tb = new TextBuilder();

    tb.line.plain('No indent');
    tb.indent();
    tb.line.plain('Level 1');
    tb.indent(2);
    tb.line.plain('Level 3');
    tb.outdent();
    tb.line.plain('Level 2');
    tb.nodent();
    tb.line.plain('Back to root');

    const expected = [
      'No indent',
      '  Level 1',
      '      Level 3',
      '    Level 2',
      'Back to root',
    ].join('\n');

    assertEquals(tb.emit(), expected);
  });
});

/** A long sentence with no styling: the normal case for help text. */
const SENTENCE = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');

/** Rows of a formatted block, ANSI stripped. */
function rows(text: string): string[] {
  return text.split('\n').map((row) => stripAnsi(row));
}

/** The widest row, measured in columns rather than characters. */
function widest(text: string): number {
  return Math.max(...rows(text).map((row) => row.length));
}

Deno.test('TextBuilder wrapping', async (t) => {
  await t.step('nothing wraps unless a width is set', () => {
    const tb = new TextBuilder();
    tb.wrap(10);
    tb.line.text(SENTENCE);
    assertEquals(rows(tb.emit()).length, 1);
  });

  await t.step('width() wraps a single long part between its words', () => {
    const tb = new TextBuilder();
    tb.width(40);
    tb.line.text(SENTENCE);
    const lines = rows(tb.emit());
    assertEquals(lines.length > 1, true);
    assertEquals(Math.max(...lines.map((row) => row.length)) <= 40, true);
    // Nothing is lost in the wrap: the rows rejoin to the original text.
    assertEquals(lines.join(' '), SENTENCE);
  });

  await t.step('a width of 0 clears the ceiling, and noWrap() clears everything', () => {
    const cleared = new TextBuilder();
    cleared.width(40).width(0);
    cleared.line.text(SENTENCE);
    assertEquals(rows(cleared.emit()).length, 1);

    const all = new TextBuilder();
    all.width(40).maxWidth(40).noWrap();
    all.line.text(SENTENCE);
    assertEquals(rows(all.emit()).length, 1);
  });

  await t.step('wrap(n) indents continuation rows by n, applied to that line only', () => {
    const tb = new TextBuilder();
    tb.width(40);
    tb.wrap(10);
    tb.line.text(SENTENCE);
    tb.line.text('short');
    const lines = rows(tb.emit());
    // Every row after the first starts with the wrap indent.
    for (const row of lines.slice(1, -1)) {
      assertEquals(row.startsWith(' '.repeat(10)), true);
    }
    // The wrap value is consumed by the first line.
    assertEquals(lines[lines.length - 1], 'short');
  });

  await t.step('wrap(16) adds to indent(), as both are cumulative', () => {
    const leading = (text: string) => rows(text).slice(1).map((row) => row.length - row.trimStart().length);

    const bare = new TextBuilder();
    bare.width(40).wrap(16);
    bare.line.text(SENTENCE);
    // 16 on its own, with no block indent.
    assertEquals(new Set(leading(bare.emit())), new Set([16]));

    const indented = new TextBuilder();
    indented.width(40).indent();
    indented.wrap(16);
    indented.line.text(SENTENCE);
    // indent() contributes 2 columns, and wrap(16) is added on top of it.
    assertEquals(new Set(leading(indented.emit())), new Set([18]));
  });

  await t.step('the indent counts against the width', () => {
    const tb = new TextBuilder();
    tb.width(40).indent(2);
    tb.line.text(SENTENCE);
    assertEquals(widest(tb.emit()) <= 40, true);
  });

  await t.step('a part wider than a row is placed whole and allowed to overflow', () => {
    const tb = new TextBuilder();
    tb.width(20);
    const token = 'x'.repeat(50);
    tb.line.text('before').text(token).text('after');
    const lines = rows(tb.emit());
    assertEquals(lines.includes(token), true);
  });

  await t.step('a styled part is measured by its columns, not its escape sequences', () => {
    // A non-TTY emits no colour, so the styling is exercised on the format path
    // directly: the part is styled, and the wrapper must still see 14 columns.
    const tb = new TextBuilder();
    tb.width(40);
    const line = tb.line.code('amzn_sfx_doorbell_chime_01').text(SENTENCE);
    const styled = (line as unknown as { _msgParts: { str: string; style?: (s: string) => string }[] })._msgParts
      .map((part) => part.style?.(part.str) ?? part.str);
    // The escape sequences are there, and the plain text is what counts.
    assertEquals(styled.join(' ').length > stripAnsi(styled.join(' ')).length, true);
    const lines = rows(tb.emit());
    assertEquals(lines.length > 1, true);
    for (const row of lines) {
      assertEquals(visualLength(row) <= 40, true);
    }
  });

  await t.step('a width does not strip the styling from the output', () => {
    // Regression: the wrap path rebuilt rows from the plain text, so setting a
    // width silently turned every styled part into unstyled text. Help screens
    // set a width, so all their colour disappeared.
    const tb = new TextBuilder();
    tb.width(100);
    const line = tb.line.h1('Heading').text('Body');
    const styled = (line as unknown as {
      _msgParts: { str: string; style?: (s: string) => string }[];
    })._msgParts.map((part) => part.style?.(part.str) ?? part.str);
    const out = tb.emit();
    // The escape sequences that format() produced are still in the result.
    for (const part of styled) {
      assertEquals(out.includes(part), true);
    }
    assertEquals(out.length > stripAnsi(out).length, true);
  });

  await t.step('every row of a wrapped line starts at the same indent', () => {
    // Regression: the first row was rendered as `indent + sep + text` by
    // format(), but the wrapper built its rows without that `sep`, so each row
    // drifted one column right of the row above it.
    const leading = (text: string) => rows(text).map((row) => row.length - row.trimStart().length);

    for (const depth of [0, 1, 2]) {
      const tb = new TextBuilder();
      tb.width(60);
      if (depth > 0) tb.indent(depth);
      tb.line.text(SENTENCE);
      const indents = new Set(leading(tb.emit()));
      assertEquals(indents.size, 1, `indent(${depth}) produced ${[...indents].join(', ')}`);
      // And that one indent is the one the unwrapped line would have had.
      const plain = new TextBuilder();
      if (depth > 0) plain.indent(depth);
      plain.line.text('short');
      assertEquals([...indents][0], leading(plain.emit())[0]);
    }
  });

  await t.step('maxWidth() follows the terminal, capped by its argument', () => {
    // Not a TTY under `deno test`, so the terminal reports 80 columns.
    const terminal = new TextBuilder();
    terminal.maxWidth();
    terminal.line.text(SENTENCE);
    assertEquals(widest(terminal.emit()) <= 80, true);

    const narrow = new TextBuilder();
    narrow.maxWidth(30);
    narrow.line.text(SENTENCE);
    assertEquals(widest(narrow.emit()) <= 30, true);

    // A ceiling above the terminal is the terminal.
    const wide = new TextBuilder();
    wide.maxWidth(1000);
    wide.line.text(SENTENCE);
    assertEquals(widest(wide.emit()) <= 80, true);
  });

  await t.step('a ceiling under the terminal is the ceiling, whatever width() says', () => {
    // The ceiling is the tighter of maxWidth and the terminal. `width()` only
    // matters when it is tighter still; it must never widen the result.
    const tb = new TextBuilder();
    tb.width(1000).maxWidth(30);
    tb.line.text(SENTENCE);
    assertEquals(widest(tb.emit()) <= 30, true);

    // A width tighter than the ceiling is the tighter one of the two: the
    // result is the lesser of width(), maxWidth() and the terminal.
    const other = new TextBuilder();
    other.maxWidth(120);
    other.width(25);
    other.line.text(SENTENCE);
    assertEquals(widest(other.emit()) <= 25, true);
  });

  await t.step('width() and maxWidth() together take the narrower', () => {
    const tb = new TextBuilder();
    tb.width(1000).maxWidth(30);
    tb.line.text(SENTENCE);
    assertEquals(widest(tb.emit()) <= 30, true);
  });
});

/**
 * The layouts the CLI help screens actually build: a styled flag, a padded
 * alignment gap, and descriptions long enough to wrap. These are the cases that
 * plain sentences do not exercise, and where wrapping went wrong before.
 */
Deno.test('TextBuilder wrapping laid out like a help screen', async (t) => {
  /** The steps table: a styled flag, then a description that runs long. */
  const steps = (width: number, wrap = 0) => {
    const tb = new TextBuilder();
    tb.width(width);
    tb.indent();
    tb.line.code('vol=30').text('Volume, a whole percentage 0 to 100. Applies to the next chime')
      .text(' '.repeat(17)).text('or sentence, so the chime can be louder than the words.').wrap(wrap);
    return tb;
  };

  await t.step('parts are one line: a break happens only when a word overflows', () => {
    // Wide enough for everything, so all four parts form a single row and the
    // padding between them is kept as it was written.
    const lines = rows(steps(400).emit());
    assertEquals(lines.length, 1);
    assertEquals(
      lines[0].trim(),
      'vol=30 Volume, a whole percentage 0 to 100. Applies to the next chime' +
        '                 or sentence, so the chime can be louder than the words.',
    );
  });

  await t.step('a row is filled before it breaks', () => {
    const lines = rows(steps(120).emit());
    assertEquals(lines.length, 2);
    // The first row is packed to the width: the next word would have overflowed.
    // A break at the part boundary instead would have cut it at 'chime', around
    // 63 columns, leaving most of the row empty.
    assertEquals(visualLength(lines[0]), 120);
    assertEquals(lines[1].trim(), 'louder than the words.');
  });

  await t.step('wrap(n) given after the line still indents the continuation', () => {
    // Regression: `wrap()` chained at the end of a line used to update only the
    // stored value, leaving the width options with an indent of 0.
    const lines = rows(steps(120, 17).emit());
    assertEquals(lines.length, 2);
    assertEquals(visualLength(lines[1]) - visualLength(lines[1].trimStart()), 17 + 2);
  });

  await t.step('a part of spaces keeps the columns apart', () => {
    const tb = new TextBuilder();
    tb.width(400);
    tb.indent();
    tb.line.code('vol=30').text('first').text(' '.repeat(10)).text('second');
    assertEquals(rows(tb.emit())[0].trim(), 'vol=30 first          second');
  });

  await t.step('a padded label keeps its full column width, wrapping or not', () => {
    // Regression: the padding inside a styled label was trimmed away by the
    // wrapper, so a table built with padEnd() collapsed to a single space and
    // the columns no longer lined up. Padding on either side of a word is part
    // of the text and must survive.
    const build = (width?: number) => {
      const tb = new TextBuilder();
      if (width !== undefined) tb.width(width);
      tb.indent();
      tb.line.code('vol=30'.padEnd(16)).text('Volume.').wrap(17);
      return rows(tb.emit())[0];
    };
    // Two columns of indent, the label 16 wide, its padding, the separator, the
    // text: the description starts at column 19 as it would without wrapping.
    const expected = '  vol=30           Volume.';
    assertEquals(build(), expected);
    assertEquals(build(120), expected);
  });

  await t.step('nothing is lost: the rows rejoin to the words in order', () => {
    const text = rows(steps(120).emit()).map((row) => row.trim()).join(' ');
    assertEquals(
      text.replace(/ +/g, ' '),
      'vol=30 Volume, a whole percentage 0 to 100. Applies to the next chime' +
        ' or sentence, so the chime can be louder than the words.',
    );
  });
});
