import * as Log from '../mod.ts';

type M = Log.MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

const LOG_FILE = './tmp/file_handler_test.log';

const logMgr = new Log.Mgr<M>();
logMgr.show = { level: true, timestamp: 'elapsed' };
logMgr.init();
const console = new Log.Transport.Console.Transport<M>(logMgr, {});
logMgr.addTransport(console);
logMgr.threshold = 'spam';
const transport = new Log.Transport.File.Transport<M>(logMgr, {
  filepath: LOG_FILE,
  color: false,
  format: Log.Transport.OutputFormat.JSON_ARRAY,
  mode: 'w',
  show: { data: true, reqId: true, sid: true, pkg: true, timestamp: 'local' },
});
// transport.show();
logMgr.addTransport(transport);
await logMgr.start();

const log: Log.Std.Logger<M> = logMgr.getLogger<L>();
log.reqIds.push('01');
log.info.h1('h1(test:)').value('value(std logger)').data({ a: 2 }).emit();
log.info.h2('last msg before stop').emit();
await logMgr.stop();
log.info.h1('Finished').emit();
