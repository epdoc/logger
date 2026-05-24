import { DateTime } from '@epdoc/datetime';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

const logMgr = new Log.Mgr<M>();

Deno.test('Log.Entity', async (t) => {
  await t.step('test', async () => {
    // Get logger first to initialize LogMgr
    const log = await logMgr.getLogger<Log.Std.Logger<M>>();

    // Now set threshold after initialization
    logMgr.threshold = 'info';

    log.pkgs.push('testpkg');

    // Use the logger's method to get a properly configured message builder
    const msgBuilder = log.info.h1('message heading');

    // Format with proper options object
    const str = msgBuilder.format({ color: false });
    assert.strictEqual(str, 'message heading');

    // The emit method now returns EmitterData, not Entry
    const record = msgBuilder.emit();
    assert.ok(record !== undefined);
    if (record) {
      // EmitterData has timestamp, formatter, and data - not level, msg, pkgs, etc.
      assert.ok(record.timestamp instanceof DateTime);
      assert.ok(record.formatter !== undefined);

      if (record.timestamp instanceof DateTime) {
        const diff = Math.abs(record.timestamp.epochMilliseconds - DateTime.now().epochMilliseconds);
        assert.ok(diff < 100); // Increased tolerance
      }
    }
  });
});
