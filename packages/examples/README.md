# Examples

This directory contains educational examples for the @epdoc/logger monorepo packages.

## Logger Examples

### Core Logger Usage
- **[logger-basics.ts](./logger-basics.ts)** - Essential logger setup patterns and basic usage
- **[logger-advanced.ts](./logger-advanced.ts)** - Advanced patterns like performance tracking and structured logging  
- **[logger-helper.ts](./logger-helper.ts)** - Using the `createLogManager` helper for simplified setup

### Running Logger Examples
```bash
# Basic logger patterns
deno run -A logger-basics.ts

# Advanced logger features  
deno run -A logger-advanced.ts

# Helper function usage
deno run -A logger-helper.ts
```

## Key Learning Paths

### For Logger Users
1. **Start with logger-basics.ts** - Learn core setup and usage
2. **Explore logger-advanced.ts** - See performance tracking and structured logging
3. **Try logger-helper.ts** - Understand the simplified setup helper

### For Custom Extensions
- **logger-advanced.ts** demonstrates domain-specific logging patterns
- **logger-helper.ts** explains the Console.extender helper
- **logger-basics.ts** shows how to extend Console.Builder with custom methods

## Migration Guide

**From complex logger setup → createLogManager helper:**
```typescript
// Before: Complex setup
const logMgr = new Log.Mgr();
logMgr.msgBuilderFactory = (emitter) => new CustomBuilder(emitter);
logMgr.init();
logMgr.threshold = 'info';

// After: Simple helper  
const logMgr = Log.createLogManager(CustomBuilder, { threshold: 'info' });
```

## Summary

These examples demonstrate the complete @epdoc/logger ecosystem:
- ✨ **Simplified setup** with `createLogManager` helper
- 🎯 **Custom logging methods** using `Console.extender`
- 📊 **Performance tracking** with marks and elapsed time
- 🏷️ **Structured logging** with labels and values
- 🔍 **Context tracking** with request IDs and package names
