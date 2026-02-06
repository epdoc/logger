# Test Variance Problem

This folder contains a minimal reproduction of the TypeScript variance issue, split into separate files to simulate the real package structure:

- `msgbuilder.ts` - Simulates @epdoc/msgbuilder package
- `logger.ts` - Simulates @epdoc/logger package  
- `context.ts` - Simulates @epdoc/cliapp context types
- `command.ts` - Simulates @epdoc/cliapp BaseCommand
- `app.ts` - Simulates user application code

## The Problem

`Console.Builder` is an alias for `ConsoleMsgBuilder`. When `Context` has a default type parameter `= Console.Builder`, TypeScript resolves it to the concrete type. This causes variance issues where `ICtx<AppBuilder>` is not assignable to `ICtx<Console.Builder>` even though `AppBuilder extends ConsoleMsgBuilder`.

## Testing

```bash
deno check test-variance/app.ts
```
