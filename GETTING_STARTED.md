# Getting Started with @epdoc/logger

This guide shows you how to use the complete @epdoc/logger ecosystem: **logger**, **msgbuilder**, and **cliapp** packages working together.

## Quick Start

### 1. Basic Logger Setup

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Simple setup with helper
const logMgr = Log.createLogManager(undefined, {
  threshold: 'info',
  showLevel: true,
  showTimestamp: 'elapsed'
});

// Get a logger with proper typing
const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

logger.info.h1('Application Started').emit();
logger.warn.text('This is a warning').emit();
```

### 2. Custom Message Builder (Recommended)

Create project-specific logging methods once:

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Define your custom logging methods
const AppBuilder = Console.extender({
  apiCall(method: string, endpoint: string) {
    return this.text('[API] ').text(method).text(' ').text(endpoint);
  },
  
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').path(path);
  },
  
  metric(name: string, value: number, unit = '') {
    return this.text('📊 ').text(name).text(': ').text(value.toString()).text(unit);
  }
});

// Create type alias for your project
type AppLogger = Log.Std.Logger<InstanceType<typeof AppBuilder>>;

// Set up logger manager
const logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
const logger = logMgr.getLogger<AppLogger>();

// Use your custom methods
logger.info.apiCall('GET', '/api/users').emit();
logger.info.fileOp('READ', './config.json').emit();
logger.info.metric('Response Time', 245, 'ms').emit();
```

### 3. CLI Application Integration

Combine with **@epdoc/cliapp** for command-line tools:

```typescript
import * as Log from '@epdoc/logger';
import * as CliApp from '@epdoc/cliapp';
import { Console } from '@epdoc/msgbuilder';

// Use the same custom builder from above
type AppLogger = Log.Std.Logger<InstanceType<typeof AppBuilder>>;

// Create application context
class AppContext implements CliApp.ICtx<InstanceType<typeof AppBuilder>, AppLogger> {
  log: AppLogger;
  logMgr: Log.Mgr<InstanceType<typeof AppBuilder>>;
  dryRun = false;
  pkg = { name: 'my-app', version: '1.0.0', description: 'My CLI app' };

  constructor() {
    this.logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
    this.log = this.logMgr.getLogger<AppLogger>();
  }

  async close() {
    await this.logMgr.close();
  }
}

// Traditional CLI setup
async function runTraditionalCLI() {
  const ctx = new AppContext();
  const command = new CliApp.Command(ctx.pkg);
  
  command.init(ctx);
  command.option('--input <file>', 'Input file');
  command.addLogging(ctx);
  
  const opts = await command.parseOpts();
  CliApp.configureLogging(ctx, opts);
  
  // Use custom logging methods
  ctx.log.info.fileOp('PROCESS', opts.input || 'stdin').emit();
  ctx.log.info.metric('Files Processed', 42).emit();
}
```

## Key Patterns

### Type Setup (Do Once Per Project)

```typescript
// 1. Define your custom builder
const MyBuilder = Console.extender({
  // Your custom methods here
});

// 2. Create type alias
type MyLogger = Log.Std.Logger<InstanceType<typeof MyBuilder>>;

// 3. Use everywhere in your project
const logger = logMgr.getLogger<MyLogger>();
```

### Performance Tracking

```typescript
const mark = logger.mark();
// ... do work ...
logger.info.text('Operation completed').ewt(mark); // Shows elapsed time
```

### Structured Logging

```typescript
logger.info.h1('User Registration')
  .label('Email:').value('user@example.com')
  .label('Role:').value('admin')
  .emit();
```

### Context Tracking

```typescript
// Set context once
logger.reqId = 'req-12345';
logger.pkgs.push('auth-service');

// All subsequent logs include context
logger.info.text('Processing request').emit();
// Output: [INFO] [req-12345] [auth-service] Processing request
```

## Migration from Complex Setup

**Before (complex factory setup):**
```typescript
const logMgr = new Log.Mgr();
logMgr.msgBuilderFactory = (emitter) => new CustomBuilder(emitter);
logMgr.init();
logMgr.threshold = 'info';
const logger = logMgr.getLogger<Log.Std.Logger<CustomBuilder>>();
```

**After (simple helper):**
```typescript
const logMgr = Log.createLogManager(CustomBuilder, { threshold: 'info' });
const logger = logMgr.getLogger<MyLogger>();
```

## Next Steps

- **Examples**: See `packages/examples/` for complete working examples
- **CLI Apps**: Check `@epdoc/cliapp` documentation for declarative command API
- **Advanced**: Read `CONFIGURATION.md` for detailed configuration options

The key insight: **Set up your types once, use simple patterns everywhere else.**
