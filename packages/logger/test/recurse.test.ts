import { DateTime } from '@epdoc/datetime';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

Deno.test('Logger Recursion', async (t) => {
  await t.step('should handle recursive logger creation and usage', async () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'spam'; // Allow all levels

    rootLogger.sid = 'sid1';
    rootLogger.reqId = 'req1';
    rootLogger.pkgs.push('pkg1');

    // Create message builder and test basic functionality
    const mb = rootLogger.info.h1('Test message');
    const str = mb.format({ color: false });
    assert.strictEqual(str, 'Test message');

    const obj = mb.emit();
    assert.ok(obj !== undefined);
    if (obj) {
      assert.ok(obj.timestamp instanceof DateTime);
      assert.ok(obj.formatter !== undefined);
    }

    // Test recursive logger creation
    const child1 = rootLogger.getChild({ reqId: 'req2a', pkg: 'pkg2a' });
    const child2 = child1.getChild({ sid: 'sid3', reqId: 'req3', pkg: 'pkg3' });

    const mb3 = child2.info.h1('Recursive message');
    const str3 = mb3.format({ color: false });
    assert.strictEqual(str3, 'Recursive message');

    const obj3 = mb3.emit();
    assert.ok(obj3 !== undefined);
    if (obj3) {
      assert.ok(obj3.timestamp instanceof DateTime);
      assert.ok(obj3.formatter !== undefined);
    }
  });

  await t.step('should maintain logger hierarchy correctly', async () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'info';

    // Test that child loggers maintain proper hierarchy
    const child1 = rootLogger.getChild({ pkg: 'level1' });
    const child2 = child1.getChild({ pkg: 'level2' });
    const child3 = child2.getChild({ pkg: 'level3' });

    assert.ok(child1 !== undefined);
    assert.ok(child2 !== undefined);
    assert.ok(child3 !== undefined);

    // Test that deeply nested logger can emit
    const msgBuilder = child3.info.text('Deep nesting test');
    const result = msgBuilder.emit();

    assert.ok(result !== undefined);
  });
});
