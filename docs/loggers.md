# Loggers

A `Logger` is an object that you use to log messages. You can get a logger from a `LogMgr` instance.

## Root Loggers and Child Loggers

There are two types of loggers: root loggers and child loggers.

### Root Loggers

A root logger is your primary logger. You can use it to log general application-level messages. You can get a root logger from a `LogMgr` instance using the `getLogger` method.

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();
const rootLogger = logMgr.getLogger();
```

### Child Loggers

A child logger is a logger that is created from another logger. A child logger inherits the configuration of its parent, but it can also have its own unique properties, such as a `reqId`.

This is particularly useful for tracing the execution of a specific task, such as handling a web request.

```typescript
// Get a root logger
const rootLogger = logMgr.getLogger();

// Create a child logger for a specific request
const childLogger = rootLogger.getChild({ reqId: 'xyz-123' });

// Use the child logger to log messages related to this request
childLogger.info('Processing request...');
```

## Important Methods

### `setThreshold(level: Level.Name | Level.Value)`

Sets the log level threshold for the logger. Only messages with a severity level at or above the threshold will be processed.

### `getChild(opts?: IGetChildParams)`

Creates a new child logger from the current logger.
