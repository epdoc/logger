# Log Levels

## Definition

There is one [LogLevels](../src/levels/base.ts) instance per Log Manager. It is
initialized with the preferred log level sets and is used to determine if a
message exceeds the log level threshold. @epdoc/logger supports these log level
sets out of the box: 

- [std](/src/levels/std/types.ts) log levels: error,  warn, info, verbose, debug, trace, spam
- [cli](/src/levels/cli/types.ts) log levels: error, warn, help, data, info, debug, prompt, verbose, input, silly

Each log level must have it's own getter in a Logger object. The following will
emit a message with the log level set to INFO:

```typescript
log.info.text('An info message').emit();
```

The `info` (or `debug`, etc.) getter returns an object (`MsgBuilder`) that is used to build the message and must be called when asking `log` to create a new log message.

You can also begin a log message by retrieving the MsgBuilder object and calling methods on that object.

```typescript
import { Log } from '@epdoc/logger';

type M = Log.MsgBuilder.Console;

const logMgr = new Log.Mgr<M>();
const log = logMgr.getLogger() as Log.std.Logger<M>;

log.info.h2('Hello, world!').emit();

// is equivalent to 

const line: Log.MsgBuilder.Console = log.info;
line.h2('Hello, world!');
line.emit();
```

### Threshold

There are two thresholds that apply across all emitted log messages:

- threshold - the threshold that filters which log messaages to emit
- flushThreshold - if a message exceeds the flush threshold, then log output is
  immediately written rather than possibly being cached.

## Customization

Look at the std or cli loggers to see how to create a custom set of log levels.
Create a definition table, interface, factory method and Logger implementation
for your logger. Your Logger can subclass one of the std or cli Loggers,
`Log.Logger.Indent` or `Log.Logger.Base`.

Use lowercase when defining your log levels (e.g. use 'info', not 'INFO').

The file [cli.test.ts](/test/cli.test.ts) shows how to use the cli log levels
instead of the default `std` log levels. You would do the same when using your
own custom log levels.

