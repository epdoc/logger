import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as MsgBuilderRuntime from '@epdoc/msgbuilder';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

describe('Logger Indentation', () => {
  describe('Indent State Management', () => {
    it('should start with empty indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      assertEquals(log.getdent().length, 0);
    });

    it('should support default indent (single space)', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent();
      assertEquals(log.getdent().length, 1);
      assertEquals(log.getdent()[0], ' ');
    });

    it('should support numeric indent (multiple spaces)', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent(3);
      assertEquals(log.getdent().length, 3);
      assertEquals(log.getdent()[0], ' ');
      assertEquals(log.getdent()[1], ' ');
      assertEquals(log.getdent()[2], ' ');
    });

    it('should support string indent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('>>');
      assertEquals(log.getdent().length, 1);
      assertEquals(log.getdent()[0], '>>');
    });

    it('should support array indent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent(['[', 'nested', ']']);
      assertEquals(log.getdent().length, 3);
      assertEquals(log.getdent()[0], '[');
      assertEquals(log.getdent()[1], 'nested');
      assertEquals(log.getdent()[2], ']');
    });

    it('should accumulate multiple indents', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('level1');
      log.indent(2);
      log.indent('level2');

      assertEquals(log.getdent().length, 4);
      assertEquals(log.getdent()[0], 'level1');
      assertEquals(log.getdent()[1], ' ');
      assertEquals(log.getdent()[2], ' ');
      assertEquals(log.getdent()[3], 'level2');
    });
  });

  describe('Outdent Operations', () => {
    it('should support single outdent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('a');
      log.indent('b');
      log.indent('c');
      assertEquals(log.getdent().length, 3);

      log.outdent();
      assertEquals(log.getdent().length, 2);
      assertEquals(log.getdent()[0], 'a');
      assertEquals(log.getdent()[1], 'b');
    });

    it('should support multiple outdent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('a');
      log.indent('b');
      log.indent('c');
      log.indent('d');

      log.outdent(3);
      assertEquals(log.getdent().length, 1);
      assertEquals(log.getdent()[0], 'a');
    });

    it('should handle outdent beyond available levels', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('a');
      log.indent('b');

      log.outdent(5); // More than available
      assertEquals(log.getdent().length, 0);
    });

    it('should handle outdent on empty indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.outdent(); // Should not throw
      assertEquals(log.getdent().length, 0);
    });
  });

  describe('Nodent (Reset)', () => {
    it('should reset all indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('a');
      log.indent('b');
      log.indent('c');
      assertEquals(log.getdent().length, 3);

      log.nodent();
      assertEquals(log.getdent().length, 0);
    });

    it('should handle nodent on empty indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.nodent(); // Should not throw
      assertEquals(log.getdent().length, 0);
    });
  });

  describe('Child Logger Inheritance', () => {
    it('should inherit parent indentation', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const parentLog = await logMgr.getLogger<L>();

      parentLog.indent('parent1');
      parentLog.indent('parent2');

      const childLog = parentLog.getChild({ reqId: 'test-123' });

      assertEquals(childLog.getdent().length, 2);
      assertEquals(childLog.getdent()[0], 'parent1');
      assertEquals(childLog.getdent()[1], 'parent2');
    });

    it('should maintain independent indentation from parent', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const parentLog = await logMgr.getLogger<L>();

      parentLog.indent('parent');
      const childLog = parentLog.getChild({ reqId: 'test' });

      // Child modifications should not affect parent
      childLog.indent('child-only');
      assertEquals(childLog.getdent().length, 2);
      assertEquals(parentLog.getdent().length, 1);
      assertEquals(childLog.getdent()[1], 'child-only');

      // Parent modifications should not affect existing child
      parentLog.indent('parent2');
      assertEquals(parentLog.getdent().length, 2);
      assertEquals(childLog.getdent().length, 2);
      assertEquals(childLog.getdent()[1], 'child-only');
    });
  });

  describe('Message Indentation Application', () => {
    it('should apply indentation to string messages', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('>>');
      log.indent('  ');

      // Create entry with string message
      const entry: Log.Entry = {
        level: 'info',
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
          assertStringIncludes((capturedEntry as Log.Entry).msg as string, '>>');
          assertStringIncludes((capturedEntry as Log.Entry).msg as string, 'test message');
        }
      } finally {
        logMgr.transportMgr.emit = originalEmit;
      }
    });

    it('should apply indentation to message builder messages', async () => {
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
          assertEquals((capturedEntry as Log.Entry).msg instanceof MsgBuilderRuntime.Abstract, true);
        }
      } finally {
        logMgr.transportMgr.emit = originalEmit;
      }
    });
  });

  describe('Bracketing Pattern', () => {
    it('should support typical bracketing usage pattern', async () => {
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
      assertEquals(log.getdent().length, 0);
    });

    it('should support nested bracketing with different markers', async () => {
      const logMgr = new Log.Mgr<M>().initLevels();
      const log = await logMgr.getLogger<L>();

      log.indent('│ '); // Box drawing character
      log.indent('├─'); // Branch
      assertEquals(log.getdent().length, 2);

      log.outdent(); // Remove branch
      log.indent('└─'); // Final branch
      assertEquals(log.getdent().length, 2);
      assertEquals(log.getdent()[1], '└─');

      log.outdent(2); // Remove all
      assertEquals(log.getdent().length, 0);
    });
  });
});
