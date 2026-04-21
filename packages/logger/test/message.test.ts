import { DateTime } from '@epdoc/datetime';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

const logMgr = new Log.Mgr<M>();

describe('Log.Entity', () => {
  test('test', async () => {
    // Get logger first to initialize LogMgr
    const log = await logMgr.getLogger<Log.Std.Logger<M>>();

    // Now set threshold after initialization
    logMgr.threshold = 'info';

    log.pkgs.push('testpkg');

    // Use the logger's method to get a properly configured message builder
    const msgBuilder = log.info.h1('message heading');

    // Format with proper options object
    const str = msgBuilder.format({ color: false });
    expect(str).toEqual('message heading');

    // The emit method now returns EmitterData, not Entry
    const record = msgBuilder.emit();
    expect(record).toBeDefined();
    if (record) {
      // EmitterData has timestamp, formatter, and data - not level, msg, pkgs, etc.
      expect(record.timestamp).toBeInstanceOf(DateTime);
      expect(record.formatter).toBeDefined();

      if (record.timestamp instanceof DateTime) {
        const diff = Math.abs(record.timestamp.epochMilliseconds - DateTime.now().epochMilliseconds);
        expect(diff).toBeLessThan(100); // Increased tolerance
      }
    }
  });
});
