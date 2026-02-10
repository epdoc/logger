# Design Decisions

## Use of `any` for Subcommand Contexts

In several places within `CommandNode`, `AbstractCommand`, and `factory.ts`, we use `any` to type the context of
subcommands.

### Problem

A command tree consists of a parent command and multiple subcommands. Each command may have its own specialized context
type (`TContext`).

- Parent commands need to store a list of subcommands.
- Subcommands often have contexts that extend, but are not strictly compatible with, the parent's context or each
  other's contexts (due to invariant or contravariant usage in methods).

TypeScript's strict variance checks for generics make it difficult to define a single collection type that can hold all
subcommands. For example, `AbstractCommand<ChildContext>` is not assignable to `AbstractCommand<ParentContext>` if
`ChildContext` adds properties or methods, especially if those types are used in method parameters (contravariant
positions).

### Solution

We use `any` for the child context type in the parent's collection of subcommands. This effectively opts out of strict
variance checks for the child context, allowing the parent to manage a heterogeneous list of subcommands.

```typescript
// Child commands are stored as accepting `any` context to allow polymorphism
subCommands?: Record<string, CommandConstructor<TContext> | CommandNode<any, any>>;
```

This is safe because:

1. The runtime logic ensures that the parent context is passed down correctly.
2. The `createContext` method on the child command is responsible for safely narrowing or transforming the parent
   context into the child context.

### Locations

- `src/types.ts`: `CommandNode.subCommands`
- `src/cmd/abstract.ts`: `#subCommands`, `getSubCommands`, `#getCachedSubCommands`
- `src/cmd/factory.ts`: `getSubCommands`, `createCommand` recursive call
