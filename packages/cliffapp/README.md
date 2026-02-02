# @epdoc/cliffapp

A standard bridge between [@epdoc/logger](https://jsr.io/@epdoc/logger) and
[deno-cliffy](https://github.com/c4spar/deno-cliffy).

This module provides a standardized way to add logging options to Cliffy
applications, automatically configure the logger based on those options, and
wrap the application lifecycle with logging and error handling.

## Features

- **Standardized CLI Flags**: Adds `--log`, `--verbose`, `--debug`, `--dry-run`,
  and more.
- **Automatic Configuration**: Maps CLI flags directly to `@epdoc/logger` status
  and levels.
- **Run Wrapper**: A logic-heavy wrapper that handles initialization, global
  actions, error reporting (including `SilentError`), and graceful shutdown.
- **Declarative & Class-based Hybrid**: Supports building CLIs using object 
  literals, classes, or a mix of both.
- **Progressive Context Refinement**: Cascading context refinement that happens 
  post-parse, allowing commands to adjust their state based on CLI flags.
- **Type Safe**: Full TypeScript support with generic builders and loggers.

## Installation

```json
{
  "imports": {
    "@epdoc/cliffapp": "jsr:@epdoc/cliffapp@^0.1.6"
  }
}
```

## Implementation Patterns

### 1. Class-based Architecture

The recommended approach for large applications. Extend `AbstractCmd` to create structured, testable commands.

```typescript
import { AbstractCmd, ICtx } from "@epdoc/cliffapp";

export class MyCommand extends AbstractCmd<ICtx> {
  protected override setupOptions(): void {
    this.cmd.description("My command description")
      .option("-f, --force", "Force execution");
  }

  protected override setupAction(): void {
    this.cmd.action((opts) => {
      this.ctx.log.info.text("Doing work...").emit();
    });
  }
}
```

### 2. Declarative Trees

Define your entire command tree as a single object literal (`CommandNode`).

```typescript
import { CommandEngine, CommandNode } from "@epdoc/cliffapp";

const TREE: CommandNode<ICtx> = {
  description: "My Hybrid CLI",
  subCommands: {
    hello: {
      description: "Say hello",
      action: async (ctx, opts) => {
        ctx.log.info.text(`Hello, ${opts.name || "World"}!`).emit();
      },
    },
  },
};

const engine = new CommandEngine(ctx);
await engine.run(TREE);
```

### 3. Hybrid Model

Classes can host object-literal subcommands, and vice versa. `AbstractCmd` automatically wraps sub-objects in a `ProxyCmd`.

```typescript
export class RootCmd extends AbstractCmd<ICtx> {
  protected override subCommands = {
    complex: ComplexClassCmd,
    simple: {
      description: "Simple task",
      action: (ctx) => ctx.log.info.text("Done").emit(),
    },
  };
}
```

---

## ADVANCED FEATURES

### Progressive Context Refinement

CliffApp supports **Top-to-Bottom context refinement**. After CLI options are parsed, the `refineContext` method is called for every command in the execution path, starting from the root.

```typescript
export class RootCmd extends AbstractCmd<MyCtx> {
  protected override refineContext(ctx: MyCtx, opts: GenericOptions): MyCtx {
    if (opts.admin) {
      ctx.isAdmin = true;
    }
    return ctx;
  }
}
```

### Functional Subcommands

You can dynamically define subcommands based on the refined context.

```typescript
export class RootCmd extends AbstractCmd<MyCtx> {
  protected override subCommands = (ctx: MyCtx) => {
    const cmds = { base: BaseCmd };
    if (ctx.isAdmin) {
      cmds.admin = AdminCmd;
    }
    return cmds;
  };
}
```

---

## Demos

For working examples of these patterns, see the [@epdoc/demo-cliffy](../demo-cliffy/README.md) package.

## Error Handling

CliffApp provides a `SilentError` class. If thrown, the `run` wrapper will log the message but omit the stack trace in non-debug modes.

```typescript
throw new SilentError("User not found");
```
