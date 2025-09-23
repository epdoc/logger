# Getting Started

This guide provides a comprehensive introduction to the `@epdoc/logger` library. It will walk you through the process of
setting up a logger, configuring its output, and logging messages.

## 1. Creating a Log Manager

The `LogMgr` is the central component of the logging system. It is responsible for managing loggers, transports, log
levels, and the new `Emitter` instances that handle direct communication between message builders and transports. To get started, create a new `LogMgr` instance:

```typescript
import { Log } from '@epdoc/logger';

// Define the type for the message builder we want to use.
// In this case, we are using the built-in Console message builder.
type M = Log.MsgBuilder.Console.Builder;

// Create a new Log Manager instance.
const logMgr = new Log.Mgr<M>();
```

## 2. Getting a Root Logger

Once you have a `LogMgr` instance, you can use it to get a "root logger". The root logger is your primary logger, and
you can use it to log general application-level messages.

```typescript
// Define the type of logger you want to use. This is the default logger type.
type L = Log.Std.Logger<M>;

const rootLogger = logMgr.getLogger<L>();
```

## 3. Configuring the Logger's Output

You can configure what information is included in the log output by setting the `show` property on the `LogMgr`.

```typescript
logMgr.show = {
  level: true, // Show the log level (e.g., INFO, WARN)
  timestamp: 'iso', // Show the timestamp in ISO format
  pkg: true, // Show the package name
  reqId: true, // Show the request ID
};
```

## 4. Logging a Simple Message

Now you can use the `rootLogger` to log messages. With the new architecture, the logging process is more efficient:

```typescript
rootLogger.info.text('Application has started.').emit();

// Console output:
// 2025-07-28T12:00:00.000Z [INFO] Application has started.
```

### What Happens When You Log

When you call `rootLogger.info.text('...').emit()`, the following streamlined process occurs:

1. **Logger Method Call:** `rootLogger.info` calls `LogMgr.getMsgBuilder('info', this)`
2. **Emitter Creation:** LogMgr creates a specialized `Emitter` that:
   - Captures the logger's context (level, sid, reqIds, pkgs)
   - Holds a direct reference to the `TransportMgr`
   - Contains threshold information for efficient filtering
3. **MsgBuilder Creation:** The configured factory creates a MsgBuilder with the Emitter
4. **Direct Emit:** When `.emit()` is called, it goes directly: `MsgBuilder` → `Emitter` → `TransportMgr` → `Transport`

This eliminates the previous complex routing through multiple logger layers.

## 5. Creating a Child Logger for a Specific Task

A common use case is to create a "child logger" for a specific task, such as handling an incoming web request. A child
logger inherits the configuration of its parent but can have its own unique properties, such as a `reqId`.

```typescript
// Imagine you're handling a web request with the ID 'xyz-123'
const reqId = 'xyz-123';

// 1. Create a child logger from the root logger
const childLogger = rootLogger.getChild({ reqId });

// 2. Use the child logger to log messages related to this request
childLogger.info.h1('Processing request').emit();
childLogger.debug.value('User authenticated successfully.').emit();

// Console output:
// 2025-07-28T12:00:00.015Z [INFO] [reqId:xyz-123] Processing request
// 2025-07-28T12:00:00.020Z [DEBUG] [reqId:xyz-123] User authenticated successfully.
```

As you can see, the `reqId` is now included in the log output for all messages logged with the `childLogger`. This makes
it easy to trace the execution of a specific request. The new architecture ensures this context is efficiently passed through the `Emitter` without additional overhead.

## 6. Setting Log Levels and Thresholds

You can control which log messages are displayed by setting the `threshold` on the `LogMgr`. The new `Emitter` architecture makes threshold checking more efficient by evaluating thresholds once during emitter creation rather than on every emit call.

```typescript
logMgr.threshold = 'warn';

rootLogger.info.text('This message will NOT be displayed.').emit();
rootLogger.warn.text('This message WILL be displayed.').emit();
```

### Flush Thresholds

The new architecture also improves flush handling. Messages that meet the flush threshold automatically trigger a flush operation without routing back through the LogMgr:

```typescript
// Messages at 'error' level or higher will flush immediately
logMgr.flushThreshold = 'error';

rootLogger.error.text('Critical error - this will flush immediately').emit();
```

You can also set a threshold on a specific logger. However, it's important to remember that the **most restrictive**
threshold (between the logger, the log manager, and the transport) is the one that takes effect. For more information,
please see the [Configuration documentation](./configuration.md).

## Performance Timing

The logger includes built-in performance timing capabilities for measuring operation durations:

```typescript
const log = logMgr.getLogger();

// Create a performance mark
const mark = log.mark();

// ... perform some operation ...

// Log with elapsed time automatically included
log.info.h1('Operation completed').ewt(mark);
// Output: "Operation completed (123 ms)"
```

For detailed information about performance timing features, see the [Classes documentation](./CLASSES.md#performance-timing).
