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

const logMgr = new Log.Mgr();

// Set the threshold to 'debug' to see all messages
logMgr.threshold = 'debug';

const logger = logMgr.getLogger();
logger.debug('This message will be displayed.');
```

### Configuring Log Output

The `show` property of the `LogMgr` controls what information is included in the log output. You can use it to show or
hide the timestamp, log level, request ID, and other information.

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();

// Configure the log output
logMgr.show = {
  level: true, // Show the log level (e.g., INFO, WARN)
  timestamp: TimestampFormat.ELAPSED, // Show the elapsed time since the application started
  package: true, // Show the package name
  reqId: true, // Show the request ID
};

const logger = logMgr.getLogger();
logger.info('This is a test message.');
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
