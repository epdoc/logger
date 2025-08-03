# Context for TypeScript Type Issue in @epdoc/logger

This document outlines a specific TypeScript type inference problem within the `@epdoc/logger` project and provides a
test case to reproduce it and verify a proposed fix.

## The Problem

A type error occurs when a consumer of this library creates a custom `Log.Mgr` with a custom `MsgBuilder`. The
`LogMgr`'s `transportMgr` property incorrectly defaults to using `Log.MsgBuilder.Console.Builder` instead of inheriting
the custom `MsgBuilder` type provided to the `LogMgr`.

This results in a type conflict similar to this:
`Property 'logMgr' in type 'CustomContext' is not assignable to the same property in base type 'ICustomCtx<CustomMsgBuilder, Logger>'.`
`Type 'LogMgr<CustomMsgBuilder>' is not assignable to type 'LogMgr<ConsoleMsgBuilder>'.`

## Files for Reproduction

I have created the following files in the `examples/` directory to create a minimal reproduction of this issue:

1. **`examples/lib/custom-msg-builder.ts`**: Defines a custom message builder.
   ```typescript
   import { Log } from '../../src/mod.ts';

   export class CustomMsgBuilder extends Log.MsgBuilder.Console.Builder {
     myCustomMethod(text: string): this {
       return this.text(`Custom: ${text}`);
     }
   }

   export const customMsgBuilderFactory: Log.MsgBuilder.FactoryMethod = (
     level: Log.Level.Name,
     emitter: Log.IEmitter,
     meetsThreshold: boolean = true,
     meetsFlushThreshold: boolean = true,
   ): CustomMsgBuilder => {
     return new CustomMsgBuilder(level, emitter, meetsThreshold, meetsFlushThreshold);
   };
   ```

2. **`examples/lib/custom-context.ts`**: Defines a context that uses the custom builder, simulating how a dependent
   project (`@jpravetz/finsync`) uses the logger.
   ```typescript
   import { Log } from '../../src/mod.ts';
   import { CustomMsgBuilder, customMsgBuilderFactory } from './custom-msg-builder.ts';

   // This is a simplified version of the CliApp.ICtx interface
   export interface ICustomCtx<M extends Log.MsgBuilder.Base.Builder, L extends Log.ILogger> {
     log: L;
     logMgr: Log.Mgr<M>;
   }

   export type M = CustomMsgBuilder;
   export type L = Log.Std.Logger<M>;

   export const logMgr: Log.Mgr<M> = new Log.Mgr<M>();
   logMgr.msgBuilderFactory = customMsgBuilderFactory;
   logMgr.init();

   export class CustomContext implements ICustomCtx<M, L> {
     log: L;
     logMgr: Log.Mgr<M> = logMgr;

     constructor() {
       this.log = logMgr.getLogger<L>();
     }
   }
   ```

3. **`examples/complex-type-issue.ts`**: The main script that uses the custom context and will trigger the error.
   ```typescript
   import { CustomContext } from './lib/custom-context.ts';

   const ctx = new CustomContext();

   ctx.log.info.myCustomMethod('This should work').emit();
   ```

## The Proposed Fix

The issue appears to be in `src/logmgr.ts`, where the `transportMgr` is initialized directly as a property. This seems
to cause TypeScript to resolve its generic type `M` to the default `Console.Builder` before the consuming class's
specific `M` type is considered.

The fix is to declare `transportMgr` but initialize it inside the `LogMgr` constructor. This ensures it correctly
captures the generic type `M` from the `LogMgr` instance being created.

**File to Modify**: `/Users/jpravetz/dev/@epdoc/logger/src/logmgr.ts`

**Change**: Replace this:

```typescript
readonly transportMgr: Transport.Mgr<M> = new Transport.Mgr<M>(this);
protected _msgBuilderFactory: MsgBuilder.FactoryMethod = MsgBuilder.Console.createMsgBuilder;
```

with this:

```typescript
readonly transportMgr: Transport.Mgr<M>;
protected _msgBuilderFactory: MsgBuilder.FactoryMethod = MsgBuilder.Console.createMsgBuilder;
// ...
constructor(opts: Log.ILogMgrSettings = {}) {
  this.transportMgr = new Transport.Mgr<M>(this);
  if (opts.show) {
    this._show = Object.assign(this._show, opts.show);
  }
}
```

## Verification Steps

1. **Confirm the error**: Run `deno check examples/complex-type-issue.ts`. It should fail with a type error related to
   `logMgr`.
2. **Apply the fix**: Modify `src/logmgr.ts` as described above.
3. **Verify the fix**: Run `deno check examples/complex-type-issue.ts` again. It should now pass without errors.
4. **Run the code**: Execute `deno run -A examples/complex-type-issue.ts` to ensure it runs successfully and produces
   the expected output.
