import { Log } from '../mod.ts';

// Define the type for the message builder we want to use.
// In this case, we are using the built-in Console message builder.
type M = Log.MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

// Create a new Log Manager instance.
const logMgr = new Log.Mgr<M>();

// Get a logger instance from the manager.
const log = logMgr.getLogger<L>();

// Set the logging threshold.
logMgr.threshold = 'verbose';

// Show the log level in the output
logMgr.show = { level: true };

// --- Example Usage ---

// A simple log message.
log.info.h2('Hello world').emit();

// You can also create a message builder instance and use it multiple times.
const line: Log.MsgBuilder.Console.Builder = log.info;
line.h2('Hello again');
line.emit();

// A more complex log message with different styles.
log.info.h1('Output').value('my value').h2('to').path('/Users/me/myfiles').emit();

// An example of logging an error.
log.error.err(new Error('Something went wrong')).emit();
