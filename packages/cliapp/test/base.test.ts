import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import * as CliApp from '../src/mod.ts';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

class TestContext extends CliApp.Ctx.AbstractBase<M, L> {}

abstract class Base extends CliApp.BaseClass<TestContext, M, L> {}

class App extends Base {}

const pkg = { name: 'test-app', version: '1.2.3', description: 'test' };

async function newApp(): Promise<App> {
  const ctx = new TestContext(pkg);
  await ctx.setupLogging();
  return new App(ctx);
}

Deno.test('BaseClass.indent', async (t) => {
  await t.step('returns the callback return value (sync primitive)', async () => {
    const app = await newApp();

    const result = app.indent(() => 42);
    assert.strictEqual(result, 42);
  });

  await t.step('returns the callback return value (explicit generic)', async () => {
    const app = await newApp();

    interface User {
      id: number;
      name: string;
    }
    const user = app.indent<User>(() => ({ id: 1, name: 'Ada' }));
    assert.deepStrictEqual(user, { id: 1, name: 'Ada' });
  });

  await t.step('opens an indent scope during the callback', async () => {
    const app = await newApp();

    app.indent(() => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      assert.strictEqual(app.ctx.log.getdent()[0].str, ' ');
    });
  });

  await t.step('outdents after the callback completes', async () => {
    const app = await newApp();

    app.indent(() => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
    });
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('preserves the return value through async', async () => {
    const app = await newApp();

    const count = await app.indent(async () => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      await Promise.resolve();
      return 7;
    });
    assert.strictEqual(count, 7);
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('propagates sync errors and still outdents', async () => {
    const app = await newApp();

    assert.throws(() => {
      app.indent(() => {
        assert.strictEqual(app.ctx.log.getdent().length, 1);
        throw new Error('boom');
      });
    }, /boom/);
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('propagates async rejection and still outdents', async () => {
    const app = await newApp();

    await assert.rejects(async () => {
      await app.indent(async () => {
        assert.strictEqual(app.ctx.log.getdent().length, 1);
        await Promise.resolve();
        throw new Error('async boom');
      });
    }, /async boom/);
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('supports nested scopes with correct outdent ordering', async () => {
    const app = await newApp();

    const outer = app.indent(() => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      const inner = app.indent(() => {
        assert.strictEqual(app.ctx.log.getdent().length, 2);
        return 'inner';
      });
      assert.strictEqual(inner, 'inner');
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      return 'outer';
    });
    assert.strictEqual(outer, 'outer');
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });
});

Deno.test('BaseClass.quote', async (t) => {
  await t.step('opens a quote scope during the callback', async () => {
    const app = await newApp();

    app.quote(() => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      assert.strictEqual(app.ctx.log.getdent()[0].str, '▌');
      assert.strictEqual(typeof app.ctx.log.getdent()[0].style, 'function');
    });
  });

  await t.step('returns the callback return value and outdents', async () => {
    const app = await newApp();

    const result = app.quote(() => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      return 'quoted';
    });
    assert.strictEqual(result, 'quoted');
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('preserves the return value through async', async () => {
    const app = await newApp();

    const result = await app.quote(async () => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      await Promise.resolve();
      return 'async quoted';
    });
    assert.strictEqual(result, 'async quoted');
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('propagates errors and still outdents', async () => {
    const app = await newApp();

    assert.throws(() => {
      app.quote(() => {
        assert.strictEqual(app.ctx.log.getdent().length, 1);
        throw new Error('quote boom');
      });
    }, /quote boom/);
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('propagates async rejection and still outdents', async () => {
    const app = await newApp();

    await assert.rejects(async () => {
      await app.quote(async () => {
        await Promise.resolve();
        throw new Error('quote async boom');
      });
    }, /quote async boom/);
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });
});

Deno.test('BaseClass.indent forwards arguments', async (t) => {
  await t.step('indent(3) pushes three levels and outdents all three', async () => {
    const app = await newApp();

    const result = app.indent(3, () => {
      assert.strictEqual(app.ctx.log.getdent().length, 3);
      assert.strictEqual(app.ctx.log.getdent()[0].str, ' ');
      return 'deep';
    });
    assert.strictEqual(result, 'deep');
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('indent(string) pushes a literal level', async () => {
    const app = await newApp();

    app.indent('>>', () => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      assert.strictEqual(app.ctx.log.getdent()[0].str, '>>');
    });
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('indent(string[]) pushes each level', async () => {
    const app = await newApp();

    app.indent(['a', 'b'], () => {
      assert.strictEqual(app.ctx.log.getdent().length, 2);
      assert.strictEqual(app.ctx.log.getdent()[0].str, 'a');
      assert.strictEqual(app.ctx.log.getdent()[1].str, 'b');
    });
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('indent(-1) removes a level and does not restore it', async () => {
    const app = await newApp();
    app.ctx.log.indent(2);

    app.indent(-1, () => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
    });
    assert.strictEqual(app.ctx.log.getdent().length, 1);
  });

  await t.step('indent(false) clears levels and does not restore them', async () => {
    const app = await newApp();
    app.ctx.log.indent(2);

    app.indent(false, () => {
      assert.strictEqual(app.ctx.log.getdent().length, 0);
    });
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('indent(n) outdents correctly on error', async () => {
    const app = await newApp();

    assert.throws(() => {
      app.indent(3, () => {
        assert.strictEqual(app.ctx.log.getdent().length, 3);
        throw new Error('deep boom');
      });
    }, /deep boom/);
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });
});

Deno.test('BaseClass.quote forwards arguments', async (t) => {
  const red = (s: string) => `<${s}>`;

  await t.step('quote(2) pushes two bars and outdents both', async () => {
    const app = await newApp();

    const result = app.quote(2, () => {
      assert.strictEqual(app.ctx.log.getdent().length, 2);
      assert.strictEqual(app.ctx.log.getdent()[0].str, '▌');
      assert.strictEqual(app.ctx.log.getdent()[1].str, '▌');
      return 'two';
    });
    assert.strictEqual(result, 'two');
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('quote(lineType) uses the named glyph', async () => {
    const app = await newApp();

    app.quote('thick', () => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      assert.strictEqual(app.ctx.log.getdent()[0].str, '┃');
    });
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('quote(opts) applies width', async () => {
    const app = await newApp();

    app.quote({ width: 2 }, () => {
      assert.strictEqual(app.ctx.log.getdent().length, 1);
      assert.strictEqual(app.ctx.log.getdent()[0].str, '▌▌');
    });
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('quote(count, lineType, style) mixes modifiers', async () => {
    const app = await newApp();

    app.quote(2, 'thin', red, () => {
      assert.strictEqual(app.ctx.log.getdent().length, 2);
      assert.strictEqual(app.ctx.log.getdent()[0].str, '│');
      assert.strictEqual(app.ctx.log.getdent()[1].str, '│');
      assert.strictEqual(app.ctx.log.getdent()[0].style, red);
      assert.strictEqual(app.ctx.log.getdent()[1].style, red);
    });
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });

  await t.step('quote(2) outdents correctly on error', async () => {
    const app = await newApp();

    assert.throws(() => {
      app.quote(2, () => {
        assert.strictEqual(app.ctx.log.getdent().length, 2);
        throw new Error('quote deep boom');
      });
    }, /quote deep boom/);
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });
});

Deno.test('BaseClass indent and quote interleaved', async (t) => {
  await t.step('indent opens a space level, quote opens a bar level', async () => {
    const app = await newApp();

    app.indent(() => {
      assert.strictEqual(app.ctx.log.getdent()[0].str, ' ');
      app.quote(() => {
        assert.strictEqual(app.ctx.log.getdent().length, 2);
        assert.strictEqual(app.ctx.log.getdent()[1].str, '▌');
      });
      assert.strictEqual(app.ctx.log.getdent().length, 1);
    });
    assert.strictEqual(app.ctx.log.getdent().length, 0);
  });
});
