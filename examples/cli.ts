import * as Log from '../packages/logger/src/mod.ts';

// Define the type for the message builder we want to use.
// In this case, we are using the built-in Console message builder.
type M = Log.MsgBuilder.Console.Builder;
type L = Log.Cli.Logger<M>;

// Create a new Log Manager instance.
const logMgr = new Log.Mgr<M>({ show: { level: true } }).init(Log.Cli.factoryMethods);

// Set the logger factory (also works)
// logMgr.loggerFactory = Log.Cli.factoryMethods;

// Set the logging threshold.
logMgr.threshold = 'silly';

// Get a logger instance from the manager.
const log = logMgr.getLogger<L>();

// --- Example Usage ---
log.info.section('Start').emit();

// A simple log message.
log.info.h2('Hello world').emit();

// You can also create a message builder instance and use it multiple times.
const line: Log.MsgBuilder.Console.Builder = log.info;
line.h2('Hello again');
line.emit();

// A more complex log message with different styles.
log.info.h1('Output').value('my value').h2('to').path('/Users/me/myfiles').emit();

// An example of logging an error.
log.error.err(new Error('Simulation of something went wrong')).emit();

log.info.error('^^ You should have seen a stack trace above this line ^^').emit();
log.info.section('Finish').emit();
