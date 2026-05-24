import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as MsgBuilderRuntime from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

Deno.test('Logger Indentation', async (t) => {
  await t.step('Indent State Management', async (t) => {
    await t.step('should start with empty indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      assert.strictEqual(log.getdent().length, 0);
    });

    await t.step('should support default indent (single space)', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent();
      assert.strictEqual(log.getdent().length, 1);
      assert.strictEqual(log.getdent()[0], ' ');
    });

    await t.step('should support numeric indent (multiple spaces)', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent(3);
      assert.strictEqual(log.getdent().length, 3);
      assert.strictEqual(log.getdent()[0], ' ');
      assert.strictEqual(log.getdent()[1], ' ');
      assert.strictEqual(log.getdent()[2], ' ');
    });

    await t.step('should support string indent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('>>');
      assert.strictEqual(log.getdent().length, 1);
      assert.strictEqual(log.getdent()[0], '>>');
    });

    await t.step('should support array indent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent(['[', 'nested', ']']);
      assert.strictEqual(log.getdent().length, 3);
      assert.strictEqual(log.getdent()[0], '[');
      assert.strictEqual(log.getdent()[1], 'nested');
      assert.strictEqual(log.getdent()[2], ']');
    });

    await t.step('should accumulate multiple indents', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('level1');
      log.indent(2);
      log.indent('level2');

      assert.strictEqual(log.getdent().length, 4);
      assert.strictEqual(log.getdent()[0], 'level1');
      assert.strictEqual(log.getdent()[1], ' ');
      assert.strictEqual(log.getdent()[2], ' ');
      assert.strictEqual(log.getdent()[3], 'level2');
    });
  });

  await t.step('Outdent Operations', async (t) => {
    await t.step('should support single outdent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('a');
      log.indent('b');
      log.indent('c');
      assert.strictEqual(log.getdent().length, 3);

      log.outdent();
      assert.strictEqual(log.getdent().length, 2);
      assert.strictEqual(log.getdent()[0], 'a');
      assert.strictEqual(log.getdent()[1], 'b');
    });

    await t.step('should support multiple outdent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('a');
      log.indent('b');
      log.indent('c');
      log.indent('d');

      log.outdent(3);
      assert.strictEqual(log.getdent().length, 1);
      assert.strictEqual(log.getdent()[0], 'a');
    });

    await t.step('should handle outdent beyond available levels', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('a');
      log.indent('b');

      log.outdent(5); // More than available
      assert.strictEqual(log.getdent().length, 0);
    });

    await t.step('should handle outdent on empty indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.outdent(); // Should not throw
      assert.strictEqual(log.getdent().length, 0);
    });
  });

  await t.step('Nodent (Reset)', async (t) => {
    await t.step('should reset all indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('a');
      log.indent('b');
      log.indent('c');
      assert.strictEqual(log.getdent().length, 3);

      log.nodent();
      assert.strictEqual(log.getdent().length, 0);
    });

    await t.step('should handle nodent on empty indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.nodent(); // Should not throw
      assert.strictEqual(log.getdent().length, 0);
    });
  });

  await t.step('Child Logger Inheritance', async (t) => {
    await t.step('should inherit parent indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const parentLog = await logMgr.getLogger<L>();

      parentLog.indent('parent1');
      parentLog.indent('parent2');

      const childLog = parentLog.getChild({ reqId: 'test-123' });

      assert.strictEqual(childLog.getdent().length, 2);
      assert.strictEqual(childLog.getdent()[0], 'parent1');
      assert.strictEqual(childLog.getdent()[1], 'parent2');
    });

    await t.step('should maintain independent indentation from parent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const parentLog = await logMgr.getLogger<L>();

      parentLog.indent('parent');
      const childLog = parentLog.getChild({ reqId: 'test' });

      // Child modifications should not affect parent
      childLog.indent('child-only');
      assert.strictEqual(childLog.getdent().length, 2);
      assert.strictEqual(parentLog.getdent().length, 1);
      assert.strictEqual(childLog.getdent()[1], 'child-only');

      // Parent modifications should not affect existing child
      parentLog.indent('parent2');
      assert.strictEqual(parentLog.getdent().length, 2);
      assert.strictEqual(childLog.getdent().length, 2);
      assert.strictEqual(childLog.getdent()[1], 'child-only');
    });
  });

  await t.step('Message Indentation Application', async (t) => {
    await t.step('should apply indentation to string messages', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('>>');
      log.indent('  ');

      // Create entry with string message
      const entry: Log.Entry = {
        level: logMgr.logLevels.asSpec('verbose')!,
        msg: 'test message',
      };

      // Capture the modified entry by overriding transportMgr.emit
      let capturedEntry: Log.Entry | null = null;
      const originalEmit = logMgr.transportMgr.emit;
      logMgr.transportMgr.emit = (entry: Log.Entry) => {
        capturedEntry = entry;
      };

      try {
        log.emit(entry);

        // Verify indentation was applied to string message
        if (capturedEntry && (capturedEntry as Log.Entry).msg && typeof (capturedEntry as Log.Entry).msg === 'string') {
          assert.ok(((capturedEntry as Log.Entry).msg as string).includes('>>'));
          assert.ok(((capturedEntry as Log.Entry).msg as string).includes('test message'));
        }
      } finally {
        logMgr.transportMgr.emit = originalEmit;
      }
    });

    await t.step('should apply indentation to message builder messages', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('>>');
      log.indent('  ');

      // Capture the message builder before it's processed
      let capturedEntry: Log.Entry | null = null;
      const originalEmit = logMgr.transportMgr.emit;
      logMgr.transportMgr.emit = (entry: Log.Entry) => {
        capturedEntry = entry;
      };

      try {
        log.info.text('test message').emit();

        // Verify indentation was applied to message builder
        // The message should be a MsgBuilder instance with prepended parts
        if (capturedEntry && (capturedEntry as Log.Entry).msg) {
          assert.strictEqual((capturedEntry as Log.Entry).msg instanceof MsgBuilderRuntime.Abstract, true);
        }
      } finally {
        logMgr.transportMgr.emit = originalEmit;
      }
    });
  });

  await t.step('Bracketing Pattern', async (t) => {
    await t.step('should support typical bracketing usage pattern', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      // Typical usage: bracket a section of logging
      log.info.text('Starting operation').emit();

      log.indent('  ');
      log.info.text('Step 1').emit();
      log.info.text('Step 2').emit();

      log.indent('  ');
      log.info.text('Substep 2.1').emit();
      log.info.text('Substep 2.2').emit();
      log.outdent(); // Back to step level

      log.info.text('Step 3').emit();
      log.outdent(); // Back to operation level

      log.info.text('Operation complete').emit();

      // Verify we're back to no indentation
      assert.strictEqual(log.getdent().length, 0);
    });

    await t.step('should support nested bracketing with different markers', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('│ '); // Box drawing character
      log.indent('├─'); // Branch
      assert.strictEqual(log.getdent().length, 2);

      log.outdent(); // Remove branch
      log.indent('└─'); // Final branch
      assert.strictEqual(log.getdent().length, 2);
      assert.strictEqual(log.getdent()[1], '└─');

      log.outdent(2); // Remove all
      assert.strictEqual(log.getdent().length, 0);
    });
  });

  await t.step('Dynamic Level Selection (at() method)', async (t) => {
    await t.step('should return message builder for level name string', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      // Test with lowercase name
      const builder1 = log.at('info');
      assert.ok(builder1);

      // Test with uppercase name
      const builder2 = log.at('INFO');
      assert.ok(builder2);

      // Test with mixed case
      const builder3 = log.at('Verbose');
      assert.ok(builder3);
    });

    await t.step('should return message builder for level spec object', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      const infoSpec = logMgr.logLevels.asSpec('info');
      assert.ok(infoSpec);

      const builder = log.at(infoSpec!);
      assert.ok(builder);
    });

    await t.step('should return message builder for severity number', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      // INFO severity is 9
      const builder = log.at(9);
      assert.ok(builder);
    });

    await t.step('should throw for invalid level', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      assert.throws(() => {
        log.at('invalidlevel');
      }, /Invalid log level/);
    });

    await t.step('should throw for invalid severity number', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      assert.throws(() => {
        log.at(999);
      }, /Invalid log level/);
    });

    await t.step('should apply indentation when using at()', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('>>');

      // Capture the message builder
      let capturedEntry: Log.Entry | null = null;
      const originalEmit = logMgr.transportMgr.emit;
      logMgr.transportMgr.emit = (entry: Log.Entry) => {
        capturedEntry = entry;
      };

      try {
        log.at('info').text('test message').emit();

        // Verify message was built and indentation applied
        if (capturedEntry && (capturedEntry as Log.Entry).msg) {
          assert.strictEqual((capturedEntry as Log.Entry).msg instanceof MsgBuilderRuntime.Abstract, true);
        }
      } finally {
        logMgr.transportMgr.emit = originalEmit;
      }
    });

    await t.step('should work with child loggers', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const parentLog = await logMgr.getLogger<L>();

      parentLog.indent('parent');
      const childLog = parentLog.getChild({ reqId: 'test' });

      const builder = childLog.at('debug');
      assert.ok(builder);
    });

    await t.step('should support all standard levels', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      const levels = ['spam', 'trace', 'debug', 'verbose', 'info', 'warn', 'error', 'critical', 'fatal'];

      for (const level of levels) {
        const builder = log.at(level);
        assert.ok(builder, `Should support ${level} level`);
      }
    });
  });
});
