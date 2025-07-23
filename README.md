# @epdoc/logger

A logging module supporting built-in and custom transports, webserver response middleware, rich message and data syntax
with color console output, chainable methods for recording log events, with the addition of a number of new methods,
many of which can be chained to create richer output with more columns of data.

## Versions

**Version 1000.0.0 indicates a major rewrite that is incompatible with prior versions of this module**

- Version prior to version 1000.0.0 (versions 2.x.x) were used in production, and were last updated at the end of 2016.
- Version 1000.0.0 is a TypeScript rewrite using Deno and is not backwards compatible with earlier versions. The main
  points for this new version are:
  - Chainable methods to allow for easy color formatting of log output when using the console
  - Maintains the Log Manager and transports concepts of the earlier version
  - Only a console and file transport have so far been written
  - Express and other middleware are not yet written, but should be easy for any user to create
  - Version 1000.0.0 is reliant on Deno std libraries for console color (I may change this dependency when I package
    this for general use)
  - substitutable log levels (e.g 'info','input','data' instead of 'info', 'verbose', 'debug')
  - customizable through class extension

# Install

```bash
deno add @epdoc/logger
```

# Quick Start

```typescript
import { Log } from '@epdoc/logger';

// Create a new Log Manager instance
const logMgr = new Log.Mgr();

// Get a root logger from the manager
const rootLogger = logMgr.getLogger();

// Log a simple message
rootLogger.info.text('Application has started.').emit();
```

# Documentation

- [Getting Started](/docs/getting-started.md)
- [Configuration](/docs/configuration.md)
- [Log Manager](/docs/logmgr.md)
- [Loggers](/docs/loggers.md)
- [Transports](/docs/transports.md)
- [Log Levels](/docs/log-levels.md)
- [Middleware](/docs/middleware.md)
- [Customization Overview](/docs/cutomization.md)

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

- More unit tests
- Update SOS transport as a general HTTP transport and rename to 'http' transport (beware).

## Author

Jim Pravetz <jpravetz@epdoc.com>.

## License

[MIT](https://github.com/strongloop/express/blob/master/LICENSE)
