import { Console } from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import * as Log from '../src/mod.ts';
import { BufferTransport } from '../src/transports/buffer/transport.ts';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

const red = (s: string) => `<${s}>`;

async function newLogger(): Promise<{ log: L; buffer: BufferTransport }> {
  const logMgr = new Log.Mgr<M>();
  logMgr.initLevels();
  logMgr.threshold = 'info';
  const buffer = new BufferTransport(logMgr, {});
  await logMgr.addTransport(buffer);
  await logMgr.start();
  const log = await logMgr.getLogger<L>();
  return { log, buffer };
}

Deno.test('Logger Quote Indentation', async (t) => {
  await t.step('quote levels and glyphs', async (t) => {
    await t.step('quote() pushes one level with the rainbow theme', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.quote();
      assert.strictEqual(log.getdent().length, 1);
      assert.strictEqual(log.getdent()[0].str, '▌');
      assert.strictEqual(typeof log.getdent()[0].style, 'function');
    });

    await t.step('quote(n) pushes n levels colored by depth', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.quote(2);
      assert.strictEqual(log.getdent().length, 2);
      assert.strictEqual(log.getdent()[0].str, '▌');
      assert.strictEqual(log.getdent()[1].str, '▌');
      assert.strictEqual(typeof log.getdent()[0].style, 'function');
      assert.notStrictEqual(log.getdent()[0].style, log.getdent()[1].style);
    });

    await t.step('a plain indent does not consume a palette slot', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent(1);
      log.quote();
      log.quote();

      // The leading plain indent (invisible) must not shift the bar colors.
      assert.strictEqual(log.getdent()[0].str, ' ');
      assert.strictEqual(log.getdent()[1].style, Console.rainbowQuoteTheme.palette[0]);
      assert.strictEqual(log.getdent()[2].style, Console.rainbowQuoteTheme.palette[1]);
    });

    await t.step('named line types resolve to glyphs', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.quote('thin');
      log.quote('medium');
      log.quote('thick');
      assert.strictEqual(log.getdent()[0].str, '│');
      assert.strictEqual(log.getdent()[1].str, '▌');
      assert.strictEqual(log.getdent()[2].str, '┃');
    });

    await t.step('width repeats the glyph', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.quote(1, { width: 2 });
      assert.strictEqual(log.getdent()[0].str, '▌▌');
    });

    await t.step('an explicit string is treated as a literal glyph', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.quote('»');
      assert.strictEqual(log.getdent()[0].str, '»');
    });

    await t.step('a style function overrides the palette', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.quote(2, red);
      assert.strictEqual(log.getdent()[0].style, red);
      assert.strictEqual(log.getdent()[1].style, red);
    });
  });

  await t.step('outdent / unquote', async (t) => {
    await t.step('unquote() backs out one quote level', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.quote(2);
      log.unquote();
      assert.strictEqual(log.getdent().length, 1);
      log.unquote();
      assert.strictEqual(log.getdent().length, 0);
    });

    await t.step('outdent and unquote share one stack', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent(1);
      log.quote(1);
      log.outdent();
      assert.strictEqual(log.getdent().length, 1);
      assert.strictEqual(log.getdent()[0].str, ' ');
    });
  });

  await t.step('output formatting', async (t) => {
    await t.step('quotes render without ANSI in no-color transports', async () => {
      const { log, buffer } = await newLogger();
      log.quote(2);
      log.info.text('hello').emit();

      assert.strictEqual(buffer.getMessages()[0], '▌ ▌ hello');
      assert.ok(!buffer.getMessages()[0].includes('\u001b'));
    });

    await t.step('a gutter part is prepended to the quote column', async () => {
      const { log, buffer } = await newLogger();
      log.gutter(2);
      log.quote(1);
      log.info.text('hello').emit();

      assert.strictEqual(buffer.getMessages()[0], '   ▌ hello');
    });

    await t.step('indent and quote can be interleaved', async () => {
      const { log, buffer } = await newLogger();
      log.indent(1);
      log.quote(1);
      log.info.text('hello').emit();

      assert.strictEqual(buffer.getMessages()[0], '  ▌ hello');
    });

    await t.step('named glyph and width render in output', async () => {
      const { log, buffer } = await newLogger();
      log.quote('thin', { width: 2 });
      log.info.text('hello').emit();

      assert.strictEqual(buffer.getMessages()[0], '││ hello');
    });
  });

  await t.step('blank', async (t) => {
    await t.step('renders the current prefix with no content', async () => {
      const { log, buffer } = await newLogger();
      log.gutter(2);
      log.quote(1);
      log.blank();

      assert.strictEqual(buffer.getMessages()[0], '   ▌');
    });

    await t.step('gutter:false emits a truly empty line', async () => {
      const { log, buffer } = await newLogger();
      log.quote(1);
      log.blank(1, { gutter: false });

      assert.strictEqual(buffer.getMessages()[0], '');
    });
  });

  await t.step('child logger inherits quote state', async () => {
    const { log, buffer } = await newLogger();
    log.gutter(2);
    log.quote(1);

    const child = log.getChild({ reqId: 'req-1' });
    assert.strictEqual(child.getdent()[0].str, '▌');

    child.info.text('hello').emit();
    assert.strictEqual(buffer.getMessages()[0], '   ▌ hello');
  });
});
