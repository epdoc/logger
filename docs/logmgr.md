# Log Manager

The `LogMgr` is the central component of the `@epdoc/logger` library. It is responsible for managing loggers, transports, and log levels.

## Creating a Log Manager

You can create a new `LogMgr` instance as follows:

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();
```

## Getting a Logger

Once you have a `LogMgr` instance, you can use it to get a logger. The `getLogger` method returns a "root logger".

```typescript
const rootLogger = logMgr.getLogger();
```

## Important Methods

### `set threshold(level: Level.Name | Level.Value)`

Sets the log level threshold for the `LogMgr`. Only messages with a severity level at or above the threshold will be processed.

### `set show(opts: EmitterShowOpts)`

Controls what information is included in the log output.

### `addTransport(transport: Transport.Base<M>)`

Adds a transport to the `LogMgr`.

### `removeTransport(transport: Transport.Base<M>)`

Removes a transport from the `LogMgr`.

### `start()`

Starts the `LogMgr` and all of its transports.

### `stop()`

Stops the `LogMgr` and all of its transports.
