# @epdoc/logger

A logging module supporting built-in and custom transports, webserver response middleware, message
and data syntax with color console output, chainable methods for recording log events, many of which
can be chained to create richer output with more columns of data.

## Features

- **Fluent API**: Chainable message building with rich formatting options
- **Multiple Log Levels**: Standard (`error`, `warn`, `info`, `verbose`, `debug`, `trace`, `spam`) and CLI-specific levels
- **Performance Timing**: Built-in `mark()` and `ewt()` (Emit With Time) for measuring operation durations
- **Flexible Transports**: Console, file, and custom transport support
- **Hierarchical Loggers**: Root and child loggers with inherited context
- **Conditional Logging**: Build messages only when conditions are met
- **Middleware Support**: Express and Oak middleware for request tracking
- **Contextual Logging**: Session IDs, request IDs, and package namespacing
- **Multiple Output Formats**: Console text, JSON, and JSON array formats
- **Configurable Display**: Control timestamps, log levels, and metadata display
- **TypeScript Support**: Full type safety with generic message builders

## Versions

**Version 1000.0.0 indicates a major rewrite that is incompatible with prior versions of this module**


# Install

```bash
deno add @epdoc/logger
```

# Quick Start

```typescript
import { Log } from '@epdoc/logger';

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
log.info.section('Start simple.ts std logger').emit();

// A simple log message.
log.info.h2('Hello world').emit();
```

# Documentation

- [Getting Started](./chapters/GETTING-STARTED.md)
- [Configuration](./chapters/CONFIGURATION.md)
- [Classes](./chapters/CLASSES.md)
- [Middleware](./chapters/MIDDLEWARE.md)
- [Oak Middleware](./chapters/OAK.md)
- [Customization Overview](./chapters/CUSTOMIZATION.md)

Check out our [example implementations](./examples).

# Why Another Logger?

I use logging extensively to

- trace proper executing of my code and also to
- enhance CLI applications with detailed output

None of the existing loggers that I could find supported the following requirements:

- easy colorization using chaninable methods
- ability to customize log levels to my own liking
- ability to extend existing classes with my own functionality (most modules default to making code private rather than
  protected)
- middleware to support backend server display of reqId, session ID so that log messaages could be filtered by request
  ID.
- custom transports:
  - at various points I have had transports for [Loggly](http://loggly.com) and SOS (a defunct desktop log display
    application)
  - external transports requires open and close support, or equivalent.
- JSON, JSON array and console text output all supported

## Action Items

- Verify middleware implementations, especially for express
- Revive old SOS transport as a general HTTP transport and rename to 'http' transport (beware).

## Author

Jim Pravetz <jpravetz@epdoc.com>.

## License

[MIT](https://github.com/strongloop/express/blob/master/LICENSE)
