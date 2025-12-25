# Architecture

The `@epdoc/logger` ecosystem consists of three integrated packages that work together to provide comprehensive logging and CLI application development:

- **[@epdoc/logger](./packages/logger/)** - Core logging functionality with flexible transports
- **[@epdoc/msgbuilder](./packages/msgbuilder/)** - Structured message formatting with colors and styling  
- **[@epdoc/cliapp](./packages/cliapp/)** - Command-line application framework with integrated logging

## Core Components

From a developer's perspective, the main classes are:

- [LogMgr](#log-manager-logmgr) - Central logging management and configuration
- [Logger](#logger) - Log message creation with level-based methods
- [MsgBuilder](#msgbuilder) - Structured message formatting and styling
- [Transports](#transports) - Output destinations (console, file, buffer, etc.)
- [ContextBundle](#contextbundle) - Type management pattern for complex applications

## Quick Start Patterns

### Simple Setup with Helper

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Use the helper for quick setup
const logMgr = Log.createLogManager(Console.Builder, {
  threshold: 'info',
  showLevel: true,
  showTimestamp: 'elapsed'
});

const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;
logger.info.h1('Application Started').emit();
```

### Custom Message Builder Pattern

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Extend with project-specific methods
const AppBuilder = Console.extender({
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').path(path);
  },
  
  apiCall(method: string, endpoint: string) {
    return this.text('🌐 ').text(method).text(' ').url(endpoint);
  }
});

type AppLogger = Log.Std.Logger<InstanceType<typeof AppBuilder>>;

const logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
const logger = logMgr.getLogger<AppLogger>();

logger.info.fileOp('READ', '/path/to/file.txt').emit();
```

## ContextBundle Pattern

For complex applications with multiple generic types, use the ContextBundle pattern to reduce type complexity:

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';

// Bundle all context types together
type AppBundle = CliApp.Cmd.ContextBundle<AppContext, AppBuilder, AppLogger>;

class ProcessCmd extends CliApp.Cmd.Sub<AppBundle, ProcessOptions> {
  // Implementation uses bundled types
}
```

This reduces generic parameters from 4 to 2 while maintaining full type safety.

## Log Manager (`LogMgr`)

The `LogMgr` is the central component responsible for managing the entire logging setup. Its main responsibilities include:

- **Configuration:** Setting global log level `threshold` and display options
- **Transports:** Managing output destinations (console, file, buffer, etc.)
- **Logger Factory:** Creating and providing `Logger` instances
- **Emitter Management:** Handling communication between builders and transports

### Creating a LogMgr

**Recommended: Use the helper function**
```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const logMgr = Log.createLogManager(Console.Builder, {
  threshold: 'info',
  showLevel: true,
  showTimestamp: 'elapsed'
});
```

**Advanced: Direct instantiation**
```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr = new Log.Mgr<M>();
const logger = logMgr.getLogger<L>();
```

### Important LogMgr Methods

- `getLogger<L>()`: Gets a logger instance and triggers initialization
- `init(factoryMethods?)`: Initializes with logger factory methods
- `set threshold(level)`: Sets minimum log level for output
- `set show(opts)`: Controls metadata display (level, timestamp, etc.)
- `addTransport(transport)`: Adds output destinations

## Logger

A `Logger` is the primary interface for writing log messages. You get loggers from a LogMgr instance.

### Root and Child Loggers

```typescript
// Get a root logger
const rootLogger = logMgr.getLogger();

// Create a child logger with context
const childLogger = rootLogger.getChild({ reqId: 'xyz-123' });
childLogger.info.text('Processing request...').emit();
```

### Logger Types

The library includes three logger types with different log levels:

- **`std` (Default):** `error`, `warn`, `info`, `verbose`, `debug`, `trace`, `spam`
- **`cli`:** `error`, `warn`, `help`, `data`, `info`, `debug`, `prompt`, `verbose`, `input`, `silly`
- **`min`:** `error`, `warn`, `info`, `debug`

```typescript
// Using CLI logger
import * as Log from '@epdoc/logger';

type L = Log.Cli.Logger<Console.Builder>;
const logMgr = new Log.Mgr<Console.Builder>().init(Log.Cli.factoryMethods);
const logger = logMgr.getLogger<L>();
```

### Important Logger Methods

- **Level methods** (`error`, `warn`, `info`, etc.): Return MsgBuilder for that level
- `getChild(opts?)`: Creates child logger with additional context
- `mark()`: Creates performance timing mark
- `demark(name)`: Measures elapsed time since mark

## MsgBuilder

Message Builders handle string formatting with colors, styling, and structure. They're created automatically when you call logger level methods.

```typescript
logger.info
  .h1('Processing Files')
  .label('Count:').value('42')
  .label('Status:').success('Complete')
  .emit();
```

The emit flow: `MsgBuilder.emit()` → `Emitter.emit()` → `TransportMgr.emit()` → `Transport.emit()`

For detailed MsgBuilder documentation, see the [msgbuilder package](./packages/msgbuilder/README.md).

## Transports

Transports control where log messages are sent. The library includes several built-in transports:

### Console Transport (Default)
```typescript
// Automatically included, no setup needed
logger.info.text('Goes to console').emit();
```

### File Transport
```typescript
const fileTransport = new Log.FileTransport({ filename: 'app.log' });
logMgr.addTransport(fileTransport);
```

### Buffer Transport (Testing)
```typescript
import { BufferTransport } from '@epdoc/logger';

const bufferTransport = new BufferTransport({ maxEntries: 100 });
logMgr.addTransport(bufferTransport);

// Later, inspect captured logs
const entries = bufferTransport.getEntries();
console.log(`Captured ${entries.length} log entries`);
```

### Custom Transports
```typescript
class CustomTransport extends Log.Transport.Base<Console.Builder> {
  protected override emit(entry: Log.Transport.Entry): void {
    // Custom output logic
    this.sendToAPI(entry);
  }
}
```

For complete transport documentation, see [TRANSPORTS.md](./packages/logger/TRANSPORTS.md).

## CLI Application Integration

The `@epdoc/cliapp` package provides seamless integration with the logging system:

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';

class AppContext extends CliApp.Ctx.Base<AppBuilder, AppLogger> {
  constructor() {
    super(pkg);
    this.setupLogging();
  }

  setupLogging() {
    this.logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
    this.log = this.logMgr.getLogger<AppLogger>();
  }
}

// Commands automatically get logging capabilities
class ProcessCmd extends CliApp.Cmd.Sub<AppBundle, ProcessOptions> {
  protected override async executeAction(args: string[], opts: ProcessOptions): Promise<void> {
    this.ctx.log.info.fileOp('PROCESS', args[0]).emit();
  }
}
```

## Performance Timing

Built-in performance timing through logger marks and MsgBuilder's `ewt()` method:

```typescript
const mark = logger.mark();
await processFile(filename);
logger.info.text('Processed file').ewt(mark).emit();
// Output: "Processed file (42.3 ms)"
```

## Entry Structure

Log entries contain structured data sent to transports:

```typescript
type Entry = {
  level: Level.Name;
  timestamp?: Date;
  sid?: string; 
  reqId?: string;
  pkg?: string;
  msg: string | MsgBuilder.IFormatter;
  data?: Record<string, unknown>;
};
```

## Best Practices

1. **Use createLogManager()** for simple setups
2. **Extend message builders** for project-specific logging methods
3. **Use ContextBundle** pattern for complex type management
4. **Create child loggers** for request/operation tracking
5. **Use BufferTransport** for testing log output
6. **Integrate with @epdoc/cliapp** for CLI applications

## Architecture Diagram

![Logger Architecture](./docs/images/epdoc_logger.png)

The architecture emphasizes:
- **Separation of concerns** between logging, formatting, and output
- **Type safety** through generic constraints and bundling patterns
- **Extensibility** through custom builders and transports
- **Performance** with efficient emit paths and timing utilities
- **Integration** with CLI application frameworks
