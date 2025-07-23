# Getting Started

This guide provides a comprehensive introduction to the `@epdoc/logger` library. It will walk you through the process of setting up a logger, configuring its output, and logging messages.

## 1. Creating a Log Manager

The `LogMgr` is the central component of the logging system. It is responsible for managing loggers, transports, and log levels. To get started, create a new `LogMgr` instance:

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();
```

## 2. Getting a Root Logger

Once you have a `LogMgr` instance, you can use it to get a "root logger". The root logger is your primary logger, and you can use it to log general application-level messages.

```typescript
const rootLogger = logMgr.getLogger();
```

## 3. Configuring the Logger's Output

You can configure what information is included in the log output by setting the `show` property on the `LogMgr`.

```typescript
import { TimestampFormat } from '@epdoc/logger';

logMgr.show = {
  level: true,       // Show the log level (e.g., INFO, WARN)
  timestamp: TimestampFormat.ELAPSED, // Show the elapsed time since the application started
  package: true,     // Show the package name
  reqId: true,       // Show the request ID
};
```

## 4. Logging a Simple Message

Now you can use the `rootLogger` to log messages.

```typescript
rootLogger.info.text('Application has started.').emit();

// Console output:
// 0.002s [INFO   ] Application has started.
```

## 5. Creating a Child Logger for a Specific Task

A common use case is to create a "child logger" for a specific task, such as handling an incoming web request. A child logger inherits the configuration of its parent but can have its own unique properties, such as a `reqId`.

```typescript
// Imagine you're handling a web request with the ID 'xyz-123'
const reqId = 'xyz-123';

// 1. Create a child logger from the root logger
const childLogger = rootLogger.getChild({ reqId });

// 2. Use the child logger to log messages related to this request
childLogger.info.h1('Processing request').emit();
childLogger.debug.value('User authenticated successfully.').emit();

// Console output:
// 0.015s [INFO   ] [reqId:xyz-123] Processing request
// 0.020s [DEBUG  ] [reqId:xyz-123] User authenticated successfully.
```

As you can see, the `reqId` is now included in the log output for all messages logged with the `childLogger`. This makes it easy to trace the execution of a specific request.

## 6. Setting Log Levels and Thresholds

You can control which log messages are displayed by setting the `threshold` on the `LogMgr`. For example, if you only want to see messages with a severity of `warn` or higher, you can do the following:

```typescript
logMgr.threshold = 'warn';

rootLogger.info.text('This message will NOT be displayed.').emit();
rootLogger.warn.text('This message WILL be displayed.').emit();
```

You can also set a threshold on a specific logger. However, it's important to remember that the **most restrictive** threshold (between the logger, the log manager, and the transport) is the one that takes effect. For more information, please see the [Configuration documentation](./configuration.md).
