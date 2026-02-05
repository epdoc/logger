# Migration Guide: CliApp v1.x → v2.0

This guide helps you migrate from CliApp v1.x to the new v2.0 architecture with automatic context flow and declarative configuration.

## Overview of Changes

CliApp v2.0 introduces a cleaner architecture inspired by modern CLI frameworks, eliminating the painful context setup while maintaining full type safety and adding powerful new features.

### Key Improvements

- **90% less boilerplate** for context management
- **Automatic context flow** from parent to child commands
- **Type-safe context transformation** via `deriveChildContext()`
- **Declarative command configuration** alongside class-based commands
- **Simplified API** - no more passing context everywhere

## Breaking Changes

### 1. Context System Overhaul

**v1.x (Complex):**
```typescript
// Multiple files and complex setup
import * as Ctx from '@epdoc/cliapp/context';

class AppContext extends Ctx.Base.Context<MyBuilder, MyLogger> {
  constructor(pkg: DenoPkg) {
    super(pkg);
    // Complex initialization...
  }
}

// Painful context passing
cmd.addLogging(ctx);
cmd.init(ctx);
```

**v2.0 (Clean):**
```typescript
// Single import, simple setup
import { Context } from '@epdoc/cliapp';

class AppContext extends Context {
  debugMode = false;
}

// Clean API
await cmd.init(ctx);
cmd.addLogging(); // Uses this.ctx automatically
```

### 2. Command Class Generics

**v1.x:**
```typescript
class MyCommand extends Command<MyBuilder, MyLogger>
```

**v2.0:**
```typescript
class MyCommand extends Command<AppContext, ChildContext, Options>
```

### 3. Method Signatures

**v1.x:**
```typescript
cmd.addLogging(ctx);           // Pass context
cmd.init(ctx);                 // Pass context
```

**v2.0:**
```typescript
await cmd.init(ctx);           // One-time setup
cmd.addLogging();              // Uses this.ctx
```

## Step-by-Step Migration

### Step 1: Update Context

**Before:**
```typescript
import * as Ctx from '@epdoc/cliapp/context';

class AppContext extends Ctx.Base.Context<Console.Builder, Log.Std.Logger> {
  debugMode = false;
  
  constructor(pkg: DenoPkg) {
    super(pkg);
  }
  
  async setupLogging() {
    // Complex setup...
  }
}
```

**After:**
```typescript
import { Context } from '@epdoc/cliapp';

class AppContext extends Context {
  debugMode = false;
  // That's it! Much simpler.
}
```

### Step 2: Update Command Classes

**Before:**
```typescript
class RootCommand extends Command<Console.Builder, Log.Std.Logger> {
  constructor(pkg: DenoPkg) {
    super(pkg);
  }
  
  init(ctx: AppContext) {
    super.init(ctx);
    this.addLogging(ctx);  // Pass context
    return this;
  }
}
```

**After:**
```typescript
class RootCommand extends Command<AppContext, ChildContext> {
  constructor() {
    super(pkg);
  }
  
  // Context flows automatically - no manual passing needed!
  protected async deriveChildContext(ctx: AppContext): Promise<ChildContext> {
    const child = new ChildContext(ctx);
    child.debugMode = ctx.debugMode;
    return child;
  }
}
```

### Step 3: Update Subcommand Registration

**Before:**
```typescript
// Manual subcommand registration
const root = new RootCommand(pkg);
root.init(ctx);

const sub = new SubCommand(pkg);
sub.init(ctx);
root.addCommand(sub);
```

**After:**
```typescript
// Automatic subcommand registration
class RootCommand extends Command<AppContext, ChildContext> {
  protected subCommands = {
    sub: SubCommand,  // Automatic registration and context flow
  };
}

const root = new RootCommand();
await root.init(ctx);  // Subcommands auto-registered with derived context
```

### Step 4: Update Application Initialization

**Before:**
```typescript
const ctx = new AppContext(pkg);
await ctx.setupLogging();

const cmd = new RootCommand(pkg);
cmd.init(ctx);
cmd.addLogging(ctx);

await run(ctx, async () => {
  const opts = await cmd.parseOpts();
  configureLogging(ctx, opts);
  // App logic...
});
```

**After:**
```typescript
const ctx = new AppContext(pkg);
await ctx.setupLogging();

const cmd = new RootCommand();
await cmd.init(ctx);
cmd.addLogging();

await run(ctx, () => cmd.parseAsync());
```

## New Features in v2.0

### 1. Declarative Commands

You can now define commands using pure configuration:

```typescript
class RootCommand extends Command<AppContext> {
  protected subCommands = {
    // Class-based command
    advanced: AdvancedCommand,
    
    // Declarative command - no class needed!
    simple: {
      name: 'simple',
      description: 'Simple command',
      options: {
        '--count <n>': 'Number of items',
        '--force': { description: 'Force execution', default: false }
      },
      arguments: ['<input>'],
      action: (ctx, opts, input) => {
        ctx.log.info.text(`Processing ${input} with count ${opts.count}`);
      }
    }
  };
}
```

### 2. Type-Safe Context Transformation

Transform context types as they flow to child commands:

```typescript
class RootCommand extends Command<AppContext, ProcessingContext> {
  protected async deriveChildContext(
    ctx: AppContext, 
    opts: RootOptions, 
    args: string[]
  ): Promise<ProcessingContext> {
    const child = new ProcessingContext(ctx);
    child.inputFiles = args;
    child.debugMode = opts.debugMode || ctx.debugMode;
    child.outputDir = opts.outputDir || './output';
    return child;
  }
}
```

### 3. Enhanced Run Function

The run function now supports testing with `noExit` option:

```typescript
// Production
await run(ctx, () => cmd.parseAsync());

// Testing
await run(ctx, () => cmd.parseAsync(), { noExit: true });
```

## Common Migration Issues

### Issue 1: Context Not Initialized

**Error:** `Context not initialized. Call init() first.`

**Solution:** Ensure you call `await cmd.init(ctx)` before using the command.

### Issue 2: Generic Type Errors

**Error:** Complex TypeScript errors about generic constraints.

**Solution:** Update your command class generics:
```typescript
// Old
class MyCommand extends Command<MyBuilder, MyLogger>

// New  
class MyCommand extends Command<MyContext, MyChildContext>
```

### Issue 3: Missing addLogging Parameter

**Error:** `addLogging` expects no parameters but you're passing context.

**Solution:** Remove the context parameter:
```typescript
// Old
cmd.addLogging(ctx);

// New
cmd.addLogging();
```

## Benefits After Migration

After migrating to v2.0, you'll enjoy:

1. **Cleaner Code** - 90% less boilerplate for context management
2. **Better Type Safety** - Compile-time validation of context flow
3. **Easier Testing** - Simplified setup and teardown
4. **More Flexibility** - Mix declarative and class-based commands
5. **Better Performance** - Optimized context inheritance

## Need Help?

If you encounter issues during migration:

1. Check the [examples](./examples/) directory for working code
2. Review the [API documentation](./README.md)
3. Compare your code with the patterns shown in this guide

The v2.0 architecture is significantly cleaner and more powerful while maintaining full backward compatibility where possible.
