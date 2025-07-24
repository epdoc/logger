## Transports

A transport is a destination for log messages. `@epdoc/logger` has built-in support for the following transport types:

-   `Console`: Logs to the console (this is the default if no other transports are configured).
-   `File`: Logs to a file.

Log messages are sent to all transports that have been added to the `LogMgr`. This means a single log message can be sent to the console and a file simultaneously.

### Configuration

You configure transports by creating an instance of a transport class and then adding it to the `LogMgr`.

#### Console Transport

Here is an example of how to configure the `Console` transport with custom options:

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();
const consoleTransport = new Log.Console(logMgr, {
  format: 'json',
  color: false,
  show: {
    timestamp: 'local'
  }
});
logMgr.addTransport(consoleTransport);
logMgr.start();

const logger = logMgr.getLogger();
logger.info.text('This will be logged to the console in JSON format.').emit();
```

#### File Transport

Here is an example of how to configure the `File` transport:

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();
const fileTransport = new Log.File(logMgr, {
  filepath: './my-app.log',
  format: 'text'
});
logMgr.addTransport(fileTransport);
logMgr.start();

const logger = logMgr.getLogger();
logger.warn.text('This will be logged to my-app.log.').emit();
```

### Common Configuration Options

Both `Console` and `File` transports share a set of common options, including:

-   `format`: Specifies the output format. Can be one of:
    -   `'text'` (Default): Human-readable text output.
    -   `'json'`: A single JSON object per log entry.
    -   `'jsonArray'`: A JSON array per log entry.
-   `show`: An object that controls which fields are included in the output (e.g., `timestamp`, `level`, `reqId`).
-   `color` (`Console` only): Enables or disables colorized output.

### File Transport Specific Options

-   `filepath`: The path to the log file.
-   `mode`: File open mode (`'a'` for append, `'w'` for write, `'x'` for create new). Defaults to `'a'`.
-   `bufferSize`: The size of the internal buffer in bytes.