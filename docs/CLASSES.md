# Classes

From a developer's perspective, the `@epdoc/logger` library's core concepts are the [LogMgr](#log-manager-logmgr) (Log Manager) and [Logger](#loggers) instances. Developers can customize their use with different Message Builders and Transports.

### Hierarchy

![image](./images/epdoc_logger.png)

## Log Manager (`LogMgr`)

The `LogMgr` is the central component responsible for managing the entire logging setup. It's typically a singleton in your application. Its main responsibilities include:

-   **Configuration:** Setting the global log level `threshold` and controlling what metadata is displayed (e.g., timestamps, request IDs) via the `show` property.
-   **Transports:** Managing where your logs are sent (e.g., console, file). Typically transports inherit log level thresholds from the LogMgr, however the implementation allows per-transport log levels to be set.
-   **Logger Factory:** Creating and providing `Logger` instances.
-   **Emitter Management:** Creating specialized `Emitter` instances that handle the direct communication between message builders and transports.

### Creating a `LogMgr`

You can create a new `LogMgr` instance as follows:

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();
```

### Selecting the [Logger](#loggers) Type

`@epdoc/logger` includes two types of loggers out of the box, each with its own set of log levels:

-   **`std` (Default):** Standard log levels (`error`, `warn`, `info`, `verbose`, `debug`, `trace`, `spam`).
-   **`cli`:** Log levels suited for command-line applications (`error`, `warn`, `help`, `data`, `info`, `debug`, `prompt`, `verbose`, `input`, `silly`).

You select the logger type when you configure your `LogMgr`. To use the `cli` logger, you must provide the `cli.createLogLevels` function to the `LogMgr` constructor and set the `loggerFactory` to `cli.getLogger`.

```typescript
import { Log } from '@epdoc/logger';

// Configure LogMgr to use the CLI logger and its log levels
const logMgr = new Log.Mgr(Log.cli.createLogLevels);
logMgr.loggerFactory = Log.cli.createLogger;

const logger = logMgr.getLogger<Log.cli.Logger<Log.MsgBuilder.Console>>(); // This will be a CliLogger instance
```

If you don't provide these, the `LogMgr` defaults to the `std` logger.

```typescript
import { Log } from '@epdoc/logger';
import { MsgBuilder } from '@epdoc/msgbuilder';

// LogMgr is using the default Logger
const logMgr = new Log.Mgr<MsgBuilder.Console.Builder,Log.std.Logger>();

const logger = logMgr.getLogger); // This will be a Log.Std.Logger instance
```


### Important `LogMgr` Methods

-   `set threshold(level: Level.Name | Level.Value)`: Sets the minimum log level to be output to a transport.
-   `set show(opts: EmitterShowOpts)`: Controls what information (e.g., `level`, `timestamp`) is included in the log output.
-   `addTransport(transport: Transport.Base<M>)`: Adds a transport (e.g., `FileTransport`).
-   `start()` / `stop()`: Starts and stops the `LogMgr` and its transports.

## Loggers (`Logger`)

A `Logger` is the object you interact with directly to write log messages. You can get a logger from a [LogMgr](#log-manager-logmgr) instance. You choose which Logger implementation you wish to use based on what log levels it supports.

### Root and Child Loggers

-   **Root Logger:** Your primary, application-wide logger, obtained by calling `logMgr.getLogger()`.
-   **Child Logger:** A logger created from another logger (a root or another child). It inherits its parent's configuration but can have unique properties, which is especially useful for tracing specific operations like handling a web request. The unique properties are referred to in this documentation as the _logger context_.

```typescript
// Get a root logger
const rootLogger = logMgr.getLogger();

// Create a child logger for a specific request
const childLogger = rootLogger.getChild({ reqId: 'xyz-123' });

// Use the child logger to log messages related to this request
childLogger.info('Processing request...').emit();
```

### Logging a Message (`Emitter`)

To log a message, when using one of the provided Logger implementations, you access a property on the logger that corresponds to a log level (e.g., `log.info`, `log.debug`). This returns a [MsgBuilder](#building-a-message-string-msgbuilder) object that you can use to construct and then emit the string portion of your message (excluding the timestamp, level, etc). 

The logging architecture uses an `Emitter` class to bridge beween the [Logger](#loggers), [MsgBuilder](#building-a-message-string-msgbuilder) and [Transport](#transports). When you call `log.info`, the following happens:

1. **Logger Method Call:** `log.info` calls `LogMgr.getMsgBuilder('info', this)`
2. **Emitter Creation:** LogMgr creates a specialized `Emitter` instance that:
   - Captures the logger's context (timestamp, level, sid, reqId, pkg)
   - Holds a direct reference to the `TransportMgr`
   - Contains threshold information for both emit and flush operations
3. **MsgBuilder Factory:** LogMgr uses the configured factory to create the appropriate MsgBuilder type
4. **Direct Emit Path:** When you call a message builder's `.emit()` method, the MsgBuilder calls the Emitter directly, which then calls the TransportMgr

The emit flow:

`MsgBuilder.emit()` → `Emitter.emit()` → `TransportMgr.emit()` → `Transport.emit()`

The lifespan of the objects in this flow is confined to the creation of a single log output message. In other words, we create new MsgBuilder and Emitter objects for each output message.

```typescript
// Simplest example of writing a log message to the console
import { Log } from '@epdoc/logger';

let logMgr = new Log.Mgr().init().setThreshold('debug');
let log = logMgr.getLogger();         // defaults to returning the std logger

log.info.h1('Hello, world!').emit();

// A more complex example
log.info
  .h1('This is a header')
  .label('label').value('value')
  .emit();
```

### Emitting a Message

Emitting a message involves sending the transport an `Entry` object, which contains the following fields:

```typescript
export type Entry = {
  level: Level.Name;
  timestamp?: Date;
  sid?: string; 
  reqId?: string;
  pkg?: string;
  msg: string | MsgBuilder.IFormatter | undefined;
  data?: Record<string,unknown> | undefined;
};
```

#### Emit to Console Transport 
A console transport might output the message as shown below. Here the transport is outputing the timestamp, log level and msg and using console.log() to output the final string. The Transport is told which of these fields to show using the `EmitterShowOpts` object. 

```bash
0.170s [INFO] Opened database for prod (6.76 ms response)
```

If all files were available and enabled, the output console message would look like this (with colors)

```bash
0.170s [INFO] username req001 pkgname Opened database for prod (6.76 ms response) { "name": "Bob" }
```
#### Emit to Logdy Transport

A logdy transport would assign each of the Entry fields to a different column in the display. The additional `data` field is provided in order to allow custom columns, or raw JSON data for whatever purpose is desired.

The msg field is either a string or a [message builder](#building-a-message-string-msgbuilder) that can format a string for output.

### Building a Message String [`MsgBuilder`] 

Message Builders are **only used for string formatting** to create the `Entry.msg` field. The string can create formatted strings with colors, styling, and structure.

Message builders are documented in [MSGBUILDER.md](./MSGBUILDER.md).


### Performance Timing

[Loggers](#loggers) provide built-in performance timing capabilities through the `mark()` and `demark()` methods, along with the message builder's `ewt()` (Emit With Time) method. Refer to the [Message Builder](./MSGBUILDER.md) documentation for how this is used.


## Transports

Transports allow directing output to the console, to a file, to a database, or to a remote server. If none are specified then the default is to log to the console.

```typescript
// Add a file transport
const fileTranport = new Log.FileTransport({ filename: 'my.log' });
logMgr.addTransport(fileTranport);

log.info.h1('This will be written to the console and to').path('my.log').emit();
```

There is more on [transports here](./transports.md).