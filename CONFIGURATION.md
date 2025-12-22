# Configuration

This document explains advanced configuration options for the `@epdoc/logger` ecosystem. For basic usage, see [GETTING_STARTED.md](./GETTING_STARTED.md).

## Logger Configuration

### Simple Configuration with createLogManager

The recommended approach uses the `createLogManager` helper:

```typescript
import * as Log from '@epdoc/logger';

const logMgr = Log.createLogManager(undefined, {
  threshold: 'debug',           // Log level threshold
  showLevel: true,             // Show [INFO], [WARN], etc.
  showTimestamp: 'elapsed',    // Show elapsed time since start
  showData: true,              // Show structured data
});

const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;
```

### Advanced Configuration

For more control, configure the LogMgr directly:

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const logMgr = new Log.Mgr<Console.Builder>().init();

// Set threshold
logMgr.threshold = 'debug';

// Configure display options
logMgr.show = {
  level: true,
  timestamp: 'iso',    // 'iso', 'local', 'elapsed', or false
  pkg: true,           // Show package names
  reqId: true,         // Show request IDs
};

// Set flush threshold (auto-flush at this level)
logMgr.flushThreshold = 'error';
```

## Custom Message Builders

### Extending Console.Builder

Create project-specific logging methods:

```typescript
import { Console } from '@epdoc/msgbuilder';

const ProjectBuilder = Console.extender({
  // API logging
  apiCall(method: string, endpoint: string, status?: number) {
    let builder = this.text('[API] ').text(method).text(' ').text(endpoint);
    if (status) {
      const statusColor = status < 400 ? 'success' : status < 500 ? 'warn' : 'error';
      builder = builder.text(' → ')[statusColor](status.toString());
    }
    return builder;
  },

  // Database operations
  dbQuery(query: string, duration?: number) {
    let builder = this.text('[DB] ').text(query);
    if (duration) {
      builder = builder.text(' ').gray(`(${duration}ms)`);
    }
    return builder;
  },

  // File operations
  fileOp(operation: string, path: string, success?: boolean) {
    let builder = this.text('📁 ').text(operation).text(' ').path(path);
    if (success !== undefined) {
      builder = builder.text(' ')[success ? 'success' : 'error'](success ? '✓' : '✗');
    }
    return builder;
  },

  // Metrics and measurements
  metric(name: string, value: number, unit = '', threshold?: number) {
    let builder = this.text('📊 ').text(name).text(': ').text(value.toString()).text(unit);
    if (threshold && value > threshold) {
      builder = builder.text(' ').warn('(above threshold)');
    }
    return builder;
  }
});

// Set up type alias for your project
type ProjectLogger = Log.Std.Logger<InstanceType<typeof ProjectBuilder>>;

// Use throughout your application
const logMgr = Log.createLogManager(ProjectBuilder, { threshold: 'info' });
const logger = logMgr.getLogger<ProjectLogger>();
```

## CLI Application Integration

### Context Setup

```typescript
import * as CliApp from '@epdoc/cliapp';

class AppContext implements CliApp.ICtx<InstanceType<typeof ProjectBuilder>, ProjectLogger> {
  log: ProjectLogger;
  logMgr: Log.Mgr<InstanceType<typeof ProjectBuilder>>;
  dryRun = false;
  pkg = { name: 'my-app', version: '1.0.0', description: 'My application' };

  constructor() {
    this.logMgr = Log.createLogManager(ProjectBuilder, {
      threshold: 'info',
      showLevel: true,
      showTimestamp: 'elapsed'
    });
    this.log = this.logMgr.getLogger<ProjectLogger>();
  }

  async close() {
    await this.logMgr.close();
  }
}
```

### Traditional CLI Setup

```typescript
async function setupTraditionalCLI() {
  const ctx = new AppContext();
  const command = new CliApp.Command(ctx.pkg);
  
  command.init(ctx);
  command.addLogging(ctx);  // Adds --verbose, --quiet, etc.
  
  const opts = await command.parseOpts();
  CliApp.configureLogging(ctx, opts);  // Apply CLI options to logger
  
  return ctx;
}
```

## Log Levels and Thresholds

### Standard Log Levels
- `error` - Critical errors
- `warn` - Warnings  
- `info` - General information (default threshold)
- `verbose` - Detailed information
- `debug` - Debug information
- `trace` - Very detailed tracing
- `spam` - Extremely verbose output

### CLI Log Levels
- `error` - Critical errors
- `warn` - Warnings
- `help` - Help text
- `data` - Data output
- `info` - General information
- `debug` - Debug information
- `prompt` - User prompts
- `verbose` - Detailed information
- `input` - User input
- `silly` - Very verbose output

### Threshold Configuration

```typescript
// Set global threshold
logMgr.threshold = 'debug';

// Set flush threshold (auto-flush at this level)
logMgr.flushThreshold = 'error';

// Per-logger threshold (most restrictive wins)
const childLogger = logger.getChild({ threshold: 'warn' });
```

## Performance and Context

### Performance Timing

```typescript
const mark = logger.mark();
// ... perform operation ...
logger.info.text('Operation completed').ewt(mark);  // Shows elapsed time
```

### Context Tracking

```typescript
// Set context on logger
logger.reqId = 'req-12345';
logger.pkgs.push('auth-service', 'user-service');

// Create child logger with additional context
const childLogger = logger.getChild({
  reqId: 'req-67890',
  pkg: 'payment-service'
});

// All logs from child include full context
childLogger.info.text('Processing payment').emit();
// Output: [INFO] [req-67890] [auth-service] [user-service] [payment-service] Processing payment
```

## Transport Configuration

### Console Transport (Default)

```typescript
const consoleTransport = new Log.Transport.Console(logMgr, {
  color: true,        // Enable colors
  level: 'info',      // Transport-specific threshold
});
logMgr.addTransport(consoleTransport);
```

### File Transport

```typescript
const fileTransport = new Log.Transport.File(logMgr, {
  filepath: './app.log',
  level: 'debug',     // Log more to file than console
});
logMgr.addTransport(fileTransport);
```

## Migration Patterns

### From Complex Factory Setup

**Before:**
```typescript
const logMgr = new Log.Mgr();
logMgr.msgBuilderFactory = (emitter) => new CustomBuilder(emitter);
logMgr.init();
logMgr.threshold = 'info';
logMgr.show = { level: true, timestamp: 'elapsed' };
```

**After:**
```typescript
const logMgr = Log.createLogManager(CustomBuilder, {
  threshold: 'info',
  showLevel: true,
  showTimestamp: 'elapsed'
});
```

### From Manual Logger Setup

**Before:**
```typescript
const logger = logMgr.getLogger<Log.Std.Logger<InstanceType<typeof CustomBuilder>>>();
```

**After:**
```typescript
type MyLogger = Log.Std.Logger<InstanceType<typeof CustomBuilder>>;
const logger = logMgr.getLogger<MyLogger>();
```

## Best Practices

1. **Define types once** - Create type aliases for your loggers
2. **Use createLogManager** - Simplifies setup significantly  
3. **Extend Console.Builder** - Add domain-specific logging methods
4. **Set up context early** - Use reqId and pkg tracking
5. **Configure thresholds appropriately** - Different levels for dev/prod
6. **Use performance timing** - Track operation durations with marks

For complete examples, see the `packages/examples/` directory.