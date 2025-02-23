import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console;
const LOG_FILE = './tmp/file_handler_test.log';

const logMgr = new Log.Mgr<M>().setShow({ level: true, timestamp: 'local' }).setThreshold('spam');
const console = new Log.Transport.Console<M>(logMgr, {});
logMgr.addTransport(console);
const transport = new Log.Transport.File<M>(logMgr, {
  filepath: LOG_FILE,
  color: false,
  format: 'json',
  mode: 'w',
  show: { data: true, reqId: true, sid: true, package: true },
});
// transport.show();
logMgr.addTransport(transport);
await logMgr.start();

const log: Log.std.Logger<M> = logMgr.getLogger() as Log.std.Logger<M>;
log.setReqId('01');
log.info.h1('h1(test:)').value('value(std logger)').data({ a: 2 }).emit();

await logMgr.stop();
log.info.h1('Finished').emit();
