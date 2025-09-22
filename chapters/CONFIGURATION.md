# Configuration

This document explains how to configure the `@epdoc/logger` library.

## Log Manager Configuration

The `LogMgr` is the central component of the logging system. It is responsible for managing loggers, transports, and log
levels. You can configure the `LogMgr` when you create it, or you can configure it later using its methods.

### Setting the Log Level Threshold

The `threshold` property of the `LogMgr` determines which log messages are processed. Only messages with a severity
level at or above the threshold will be passed to the transports. The default threshold is `info`.

```typescript
import { Log } from '@epdoc/logger';

type M = Log.MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr = new Log.Mgr<M>();

// Set the threshold to 'debug' to see all messages
logMgr.threshold = 'debug';

const log = logMgr.getLogger<L>();
log.debug('This message will be displayed.');
```

### Configuring Log Output Format

The `show` property of the `LogMgr` controls what information is included in the log output. You can use it to show or
hide the timestamp, log level, request ID, and other information.

```typescript
// Configure the log output
logMgr.show = {
  level: true, // Show the log level (e.g., INFO, WARN)
  timestamp: TimestampFormat.ELAPSED, // Show the elapsed time since the application started
  package: true, // Show the package name
  reqId: true, // Show the request ID
};
```

The type `EmitterShowOpts` is defined in [../src/types.ts](../packages/logger/src/types.ts).

## Log Levels

`@epdoc/logger` comes out of the box with two sets of log levels: 

- [std](../src/loggers/std/consts.ts) - supports `error`, `warn`, `info`, `verbose`, `debug`, `trace`, `spam`
- [cli](../src/loggers/cli/consts.ts) - supports  `error`, `warn`, `help`, `data`, `info`, `debug`, `prompt`, `verbose`, `input`, `silly`

You initialize the LogMgr to tell it which log levels to use.

```ts
type M = Log.MsgBuilder.Console.Builder;
type L = Log.Cli.Logger<M>;

// Create a new Log Manager instance.
const logMgr = new Log.Mgr<M>({ show: { level: true } })

// Initialize to use the CLI logger. Uses `Log.Std.factoryMethods` by default
logMgr.init(Log.Cli.factoryMethods);

// Set the logging threshold (cannot call before calling either init() or getLogger())
logMgr.threshold = 'silly';

// Get a logger instance from the manager.
const log = logMgr.getLogger<L>();

// --- Example Usage ---
log.info.section('Start').emit();
```

## Transport Configuration

Transports are responsible for sending log messages to their destination, such as the console or a file. You can add and
configure transports on the `LogMgr`.

### Console Transport

The `Console` transport is the default transport. It logs messages to the console. You can configure its options when
you add it to the `LogMgr`.

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();

// Add a console transport with custom options
const consoleTransport = new Log.Transport.Console(logMgr, {
  color: true, // Use colors in the console output
});
logMgr.addTransport(consoleTransport);

const logger = logMgr.getLogger();
logger.info('This message will be colored.');
```

### File Transport

The `File` transport logs messages to a file. You must provide a `filepath` when you create it.

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();

// Add a file transport
const fileTransport = new Log.Transport.File(logMgr, {
  filepath: './my-app.log',
});
logMgr.addTransport(fileTransport);

const logger = logMgr.getLogger<Log.std.Logger<Log.MsgBuilder.Console>>();
logger.info('This message will be written to the file.');
```

## Further Customization

### Initialization

In our examples, we've been showing how to create a `Log.Mgr`, initialize it, and get a root logger. I like to capture all of this setup into my your own `log.ts` initialization file. You can also subclass the `LogMgr` and implement your initialization within your subclass. This approach is shown in [examples/extend-mgr.ts](../examples/extend-mgr.ts).

### Log Levels

You can define your own log levels by recreating either the [cli](../src/loggers/cli) or [std](../src/loggers/std) loggers and initializing the LogMgr with your new custom logger.

### MsgBuilder

You can implement your own MsgBuilder, by cloning the [Console](../src/message/console) MsgBuilder. 

You can also extend the `Console` MsgBuilder as shown in [examples/builder.ts](../examples/builder.ts). I find it handy to add new methods for objects that I need to repeatedly log. For instance I have an application that reads email messages, and I have a custom message builder method that writes the identifying parts of that email message when I pass it the Message object.

### Transports

Clone one of the existing transports and add it to the LogMgr. Please submit any useful ones so I can add them to the project.