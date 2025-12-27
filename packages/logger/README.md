# @epdoc/logger

> **📚 Complete Documentation**: This package is part of the [@epdoc/logger ecosystem](../../README.md). For comprehensive guides, tutorials, and integration examples, see the [root documentation](../../README.md).

A logging module supporting built-in and custom transports, with chainable message building and rich formatting options.

## Quick Links to Complete Documentation

- **[🚀 Getting Started Guide](../../GETTING_STARTED.md)** - Complete ecosystem tutorial
- **[🎯 Demo Project](../../packages/demo/)** - Complete working CLI app example
- **[💡 Examples Collection](../../packages/examples/)** - Focused usage examples
- **[🏗️ Architecture Overview](../../ARCHITECTURE.md)** - Technical deep-dive  
- **[⚙️ Configuration Guide](../../CONFIGURATION.md)** - Advanced configuration
- **[💻 CLI Integration](../../packages/cliapp/README.md)** - Build CLI apps with logging
- **[🎨 Message Formatting](../../packages/msgbuilder/README.md)** - Rich message builders

## Package-Specific Features

This package provides the core logging functionality with:

- **Fluent API**: Chainable message building with rich formatting options
- **Multiple Log Levels**: Standard (`error`, `warn`, `info`, `verbose`, `debug`, `trace`, `spam`) with the ability to be customized.
- **Hierarchical Indentation**: Built-in `indent()`, `outdent()`, `nodent()` methods for structured, nested logging output
- **Performance Timing**: Built-in `mark()` and `ewt()` (Emit With Time) for measuring operation durations
- **Flexible Transports**: Console, file, buffer (for testing), and custom transport support
- **Hierarchical Loggers**: Root and child loggers with inherited context and indentation
- **Conditional Logging**: Build messages only when inline conditions are met
- **Middleware Support**: Express and Oak middleware for request tracking
- **Contextual Logging**: Session IDs, request IDs, and package namespacing
- **Multiple Output Formats**: Console text, JSON, and JSON array formats
- **Configurable Display**: Control timestamps, log levels, and metadata display
- **TypeScript Support**: Full type safety with generic message builders

## Versions

**Version 1000.0.0 indicates a major rewrite that is incompatible with prior versions of this module**


## Installation

```bash
deno add @epdoc/logger
```

> **💡 Ecosystem Integration**: This package works best when combined with [@epdoc/msgbuilder](../msgbuilder/) for rich formatting and [@epdoc/cliapp](../cliapp/) for CLI applications. See the [complete ecosystem guide](../../GETTING_STARTED.md) for integrated usage patterns.

# Quick Start

## Simple Setup with Helper

The easiest way to get started is with the `createLogManager` helper:

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Basic setup
const logMgr = Log.createLogManager(undefined, {
  threshold: 'info',
  showLevel: true,
  showTimestamp: 'elapsed'
});

const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;
logger.info.h1('Hello').text(' World!').emit();
```

## Complete Integration Guide

For complete setup patterns including custom message builders and CLI integration:

- **[🚀 Getting Started Guide](../../GETTING_STARTED.md)** - Complete ecosystem tutorial with logger + msgbuilder + cliapp
- **[⚙️ Configuration Guide](../../CONFIGURATION.md)** - Advanced configuration options  
- **[💡 Examples](../examples/)** - Working code examples
- **[🏗️ Architecture](../../ARCHITECTURE.md)** - Technical architecture overview

**Key Pattern**: Define your types once per project, then use simple patterns everywhere:

```typescript
// 1. Set up custom builder (once per project)
const AppBuilder = Console.extender({
  apiCall(method: string, endpoint: string) {
    return this.text('[API] ').text(method).text(' ').text(endpoint);
  }
});

// 2. Create type alias (once per project)  
type AppLogger = Log.Std.Logger<InstanceType<typeof AppBuilder>>;

// 3. Use everywhere
const logger = logMgr.getLogger<AppLogger>();
logger.info.apiCall('GET', '/users').emit();
```


## Custom Builder Setup

For projects needing custom logging methods, combine with `Console.extender`:

```typescript
import { Console } from '@epdoc/msgbuilder';
import * as Log from '@epdoc/logger';

// Create custom builder with project-specific methods
const ProjectBuilder = Console.extender({
  apiCall(method: string, endpoint: string) {
    return this.text(`[API] ${method} ${endpoint}`);
  },
  
  metric(name: string, value: number) {
    return this.text(`[METRIC] ${name}: ${value}`);
  }
});

// Simple one-liner setup
const logMgr = Log.createLogManager(ProjectBuilder, { 
  threshold: 'info' 
});

const logger = logMgr.getLogger();
// Use custom methods (with type assertion for now)
(logger.info as any).apiCall('GET', '/api/users').emit();
```

# Logger Helper

The `createLogManager` helper simplifies logger setup and eliminates boilerplate code. It's especially useful when combined with custom message builders.

## API

```typescript
function createLogManager<T extends Console.Builder>(
  BuilderClass?: new (emitter: IEmitter) => T,
  options?: LogManagerOptions
): LogMgr<T>
```

### Options

```typescript
interface LogManagerOptions {
  threshold?: 'spam' | 'trace' | 'debug' | 'info' | 'warn' | 'error';
  showLevel?: boolean;
  showTimestamp?: 'elapsed' | 'local' | 'utc' | boolean;
  showData?: boolean;
}
```

## Migration Benefits

**Before** (complex factory setup) [v1003.1.*]:
```typescript
// Old way - lots of boilerplate
const msgBuilderFactory = (emitter) => new CustomMsgBuilder(emitter);
const logMgr = new Log.Mgr();
logMgr.msgBuilderFactory = msgBuilderFactory;
logMgr.init();
logMgr.threshold = 'info';
logMgr.show.level = true;
```

**After** (simple helper) [v1003.1.*]:
```typescript
// New way - one line
const logMgr = Log.createLogManager(CustomBuilder, { 
  threshold: 'info', 
  showLevel: true 
});
```

This reduces CLI setup boilerplate by approximately 70% while maintaining full type safety and backward compatibility.

## Manual Setup (Advanced)

For full control over the setup process:

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

// Hierarchical logging with indentation
log.info.text('Starting operation').emit();
log.indent('  ');
log.info.text('Step 1: Initialize').emit();
log.info.text('Step 2: Process').emit();
log.indent('  ');
log.info.text('Substep 2.1: Validate').emit();
log.info.text('Substep 2.2: Transform').emit();
log.outdent(2); // Back to root level
log.info.text('Operation complete').emit();
```

## Color Output

When you setup a transport, you tell the transport whether to use color or not. Of our bundled transports, only the `Console` Transport supports color and by default it will appear with color output.

You can force color on or off (where supported by a transport) by setting the color property of 

# Documentation

- [Getting Started](./GETTING-STARTED.md)
- [Configuration](./CONFIGURATION.md)
- [Architecture](./ARCHITECTURE.md)
- [Message Builder](./MSGBUILDER.md)
- [Oak Middleware](./docs/OAK.md)

Check out our [example implementations](./packages/examples).

# Why Another Logger?

I use logging extensively to

- trace proper executing of my code and also to
- enhance CLI applications with detailed output

None of the existing loggers that I could find supported the following requirements:

- easy colorization using chainable methods
- ability to customize log levels to my own liking
- ability to extend existing classes with my own functionality (most modules default to making code private rather than
  protected)
- middleware to support backend server display of reqId, session ID so that log messages could be filtered by request
  ID.
- hierarchical indentation for structured logging output
- custom transports:
  - **Buffer transport** for testing and programmatic log inspection
  - A [logdy](https://logdy.dev/) transport is in development
  - external transports requires open and close support, or equivalent.
- JSON, JSON array and console text output all supported

## Action Items

- Verify middleware implementations, especially for express
- Revive old SOS transport as a general HTTP transport and rename to 'http' transport (beware).

## Author

Jim Pravetz <jpravetz@epdoc.com>.

## License

[MIT](https://github.com/strongloop/express/blob/master/LICENSE)
