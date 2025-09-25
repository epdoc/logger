import type * as MsgBuilder from '@epdoc/msgbuilder';
import { describe, test } from '@std/testing/bdd';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Abstract;
type L = Log.Std.Logger<M>;

const LOG_FILE = '../../../tmp/file_handler_test.log';
const logFilePath = new URL(LOG_FILE, import.meta.url).pathname;

describe('File Transport', () => {
  test('should write to a file', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.show = { level: true, timestamp: 'elapsed' };
    logMgr.init();
    const console = new Log.Transport.Console.Transport(logMgr, {});
    logMgr.addTransport(console);
    logMgr.threshold = 'spam';
    const transport = new Log.Transport.File.Transport(logMgr, {
      filepath: logFilePath,
      color: false,
      format: Log.Transport.OutputFormat.JSON_ARRAY,
      mode: 'w',
      show: { data: true, reqId: true, sid: true, pkg: true, timestamp: 'local' },
    });
    // transport.show();
    logMgr.addTransport(transport);
    await logMgr.start();

    const log: Log.Std.Logger<M> = logMgr.getLogger<L>();
    log.reqId = '01';
    (log.info as MsgBuilder.Console.Builder).h1('h1(test:)').value('value(std logger)').data({ a: 2 }).emit();
    (log.info as MsgBuilder.Console.Builder).h2('last msg before stop').emit();
    await logMgr.stop();
    (log.info as MsgBuilder.Console.Builder).h1('Finished').emit();
  });
});
