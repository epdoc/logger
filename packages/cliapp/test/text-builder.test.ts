import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { TextBuilder } from '../src/text-builder.ts';
import { MsgBuilder } from '../src/context.ts';

describe('TextBuilder', () => {
  it('should format multiple lines with default MsgBuilder', () => {
    const tb = new TextBuilder();

    tb.line.plain('Line 1');
    tb.line.plain('Line 2');
    tb.newline();
    tb.line.plain('Line 3');

    const expected = 'Line 1\nLine 2\n\nLine 3';
    assertEquals(tb.emit(), expected);
    assertEquals(tb.toString(), expected);
  });

  it('should format multiple lines with custom MsgBuilder class', () => {
    class CustomBuilder extends MsgBuilder {
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

  it('should support indentation levels', () => {
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
