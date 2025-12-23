# Examples

This directory contains educational examples for the @epdoc/logger monorepo packages.

## CLI App Examples

### BaseContext Pattern
- **[cliapp.run.ts](./cliapp.run.ts)** - Complete CLI app using BaseContext with declarative API
  - Custom message builders with project-specific methods
  - Command arguments (variadic and optional)
  - Root options available to all subcommands
  - Type-safe option parsing with separate declaration pattern
  - Real-world CLI patterns (file processing, cleanup operations)

### Running CLI App Examples
```bash
# Basic CLI app with BaseContext
deno run -A cliapp.run.ts --help
deno run -A cliapp.run.ts process --help
deno run -A cliapp.run.ts process file1.txt file2.txt --verbose
deno run -A cliapp.run.ts clean /tmp --dry-run
```

## Logger Examples

### Core Logger Usage
- **[logger.basics.run.ts](./logger.basics.run.ts)** - Essential logger setup patterns and basic usage
- **[logger.advanced.run.ts](./logger.advanced.run.ts)** - Advanced patterns like performance tracking and structured logging  
- **[logger.helper.run.ts](./logger.helper.run.ts)** - Using the `createLogManager` helper for simplified setup

### Running Logger Examples
```bash
# Basic logger patterns
deno run -A logger.basics.run.ts

# Advanced logger features  
deno run -A logger.advanced.run.ts

# Helper function usage
deno run -A logger.helper.run.ts
```

## Key Learning Paths

### For CLI App Development
1. **Start with cliapp.run.ts** - Complete CLI app pattern with BaseContext
2. **Study the declarative API** - Arguments, options, and command structure
3. **Understand type assertions** - Working with ParsedOptions and custom contexts

### For Logger Users
1. **Start with logger.basics.run.ts** - Learn core setup and usage
2. **Explore logger.advanced.run.ts** - See performance tracking and structured logging
3. **Try logger.helper.run.ts** - Understand the simplified setup helper
4. **See cliapp.run.ts** - Real-world logger integration in CLI apps

### For Custom Extensions
- **cliapp.run.ts** demonstrates custom msgbuilder integration in CLI apps
- **logger.advanced.run.ts** demonstrates domain-specific logging patterns
- **logger.basics.run.ts** shows how to extend Console.Builder with custom methods

## CLI App Architecture

**BaseContext Pattern (Recommended):**
```typescript
// 1. Define custom msgbuilder
const AppBuilder = Console.extender({
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').path(path);
  }
});

// 2. Define types once per project
type MsgBuilder = InstanceType<typeof AppBuilder>;
type Logger = Log.Std.Logger<MsgBuilder>;

// 3. Extend BaseContext
class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  constructor() {
    super(pkg);
    this.setupLogging(); // Must call in constructor
  }
  
  setupLogging() {
    this.logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
    this.log = this.logMgr.getLogger<Logger>();
  }
}

// 4. Use declarative API with arguments
const cmd = CliApp.Declarative.defineCommand({
  name: 'process',
  arguments: [{ name: 'files', variadic: true }],
  options: { verbose: CliApp.Declarative.option.boolean('--verbose') },
  action: async (ctx, args, opts) => {
    // ctx: AppContext, args: string[], opts: ParsedOptions
  }
});
```

## Migration Guide

**From complex factory setup → BaseContext pattern:**
```typescript
// Before: Complex factory setup with generics
class AppFactory extends CliApp.Factory<MsgBuilder, Logger> {
  // Complex generic constraints and setup
}

// After: Simple BaseContext extension
class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  constructor() { super(pkg); this.setupLogging(); }
  setupLogging() { /* simple setup */ }
}
```

**From imperative → declarative API:**
```typescript
// Before: Imperative command setup
cmd.argument('<files...>', 'Files to process');
cmd.option('--verbose', 'Verbose output');
cmd.action(async (files, opts) => { /* ... */ });

// After: Declarative command definition
const cmd = defineCommand({
  arguments: [{ name: 'files', variadic: true }],
  options: { verbose: option.boolean('--verbose') },
  action: async (ctx, args, opts) => { /* ... */ }
});
```

## Summary

These examples demonstrate the complete @epdoc ecosystem:
- 🚀 **BaseContext pattern** - Simplified CLI app development
- 📝 **Declarative API** - Clean command definitions with arguments and options
- ✨ **Type safety** - Separate declaration pattern for options
- 🎯 **Custom logging** - Project-specific message builders
- 📊 **Real-world patterns** - File processing, cleanup, and CLI operations
