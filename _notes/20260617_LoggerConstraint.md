# Logger Generic Constraint Fix

## Date

2026-06-17

## Problem

Projects using a custom `MsgBuilder` with `AbstractBase` got:

```
Type 'StdLogger<CustomMsgBuilder>' does not satisfy constraint 'StdLogger<any>'.
  Property '#appendParams' is missing but required in type 'StdLogger<any>'.
```

## Root Cause

`#private` fields in generic classes create unique brands per instantiation.
`StdLogger<M>` extends `AbstractLogger<M>`, which has `#appendParams`. TypeScript
treats `StdLogger<CustomMsgBuilder>` and `StdLogger<any>` as different brands
because their `#private` fields come from different generic instantiations. So
`L extends Logger` (where `Logger = StdLogger<any>`) rejects the custom builder.

## Solution

Introduced `LoggerConstraint` — an interface intersection that avoids the
`#private` branding issue entirely:

```typescript
type LoggerConstraint = Log.ILoggerEmitter & Log.IInherit;
```

Changed `ICtx` and `AbstractBase` to use `LoggerConstraint` for the `L`
parameter constraint. The exported `Logger` type alias remains `StdLogger<any>`
to preserve backwards compatibility for all external consumers.

`StdLogger<CustomMsgBuilder>` satisfies `LoggerConstraint` because
`AbstractLogger` explicitly implements both `ILoggerEmitter` and `IInherit`.

## Key Files

- `packages/cliapp/src/context.ts` — Added `LoggerConstraint`, changed
  `ICtx<L extends Logger>` → `ICtx<L extends LoggerConstraint>` and
  `AbstractBase<L extends Logger>` → `AbstractBase<L extends LoggerConstraint>`

## Additional Changes

Updated `@epdoc/logger` dependency from `^1003.3.54` to `^1003.3.55` to pick up
the latest published version that doesn't conflict.

## Commit Message

```
Fix: Relax L constraint in AbstractBase/ICtx to avoid #private branding

Replace `L extends Logger` (StdLogger<any>) with `L extends LoggerConstraint`
(ILoggerEmitter & IInherit) in ICtx and AbstractBase. The concrete class
constraint fails for custom MsgBuilders because #private fields (in
AbstractLogger) create unique brands per generic instantiation.

The exported Logger type alias remains StdLogger<any> for backwards compat.
```