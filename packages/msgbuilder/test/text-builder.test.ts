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

  await t.step('coloured parts keep their styling and measure by columns, not characters', () => {
    const tb = new TextBuilder();
    tb.width(40);
    tb.line.code('amzn_sfx_doorbell_chime_01').text(SENTENCE);
    // `color: true` forces styling even though a test is not a TTY.
    const lines = tb.toLines().map((row) => tb.lines.length > 0 ? row : row);
    const forced = (tb.lines[0] as Console.Builder).format({ color: true });
    // Styled output is longer than its plain text, so escapes are present.
    assertEquals(forced.length > stripAnsi(forced).length, true);
    for (const row of rows(forced)) {
      assertEquals(visualLength(row) <= 40, true);
    }
    assertEquals(lines.length, 1);
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

  await t.step('width() and maxWidth() together take the narrower', () => {
    const tb = new TextBuilder();
    tb.width(1000).maxWidth(30);
    tb.line.text(SENTENCE);
    assertEquals(widest(tb.emit()) <= 30, true);
  });
});
