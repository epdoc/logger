# @epdoc/demo-cliffy

This package provides three demo implementations showing how to use **@epdoc/cliffapp** to build structured, type-safe CLI applications with built-in logging and context management.

## CLI Patterns

We support three primary patterns for building your CLI. You can choose the one that best fits your complexity or mix them together.

### 1. Class-based Pattern (`main_class.ts`)
The most structured approach, where every command is a class extending `AbstractCmd`. 
- **Best for**: Complex commands with internal state or complex setup logic.
- **Key Features**: 
  - Lifecycle hooks (`setupOptions`, `setupAction`).
  - Strict type safety for options and context.
  - Progressive Context Refinement via `refineContext`.

```bash
# Run the class-based demo
deno run -A main_class.ts --help
deno run -A main_class.ts --debug-mode sub "test-input"
```

### 2. Declarative Pattern (`main_declarative.ts`)
Define your entire command tree as a single object literal (`CommandNode`).
- **Best for**: Small to medium sized CLIs or simple "leaf" commands.
- **Key Features**:
  - Extremely concise.
  - No need to manage class instances.
  - Automatically bridge into a Cliffy `Command` via `CommandEngine`.

```bash
# Run the declarative demo
deno run -A main_declarative.ts hello --name Antigravity
```

### 3. Hybrid Pattern (`main_hybrid.ts`)
The most flexible approach, where `AbstractCmd` classes can host `CommandNode` object literals as subcommands.
- **Best for**: Large CLIs where the root/core is structured, but many leaf commands are simple enough to be defined inline.
- **Key Features**:
  - Start with classes where structure is needed.
  - Inline simple commands as you go.

```bash
# Run the hybrid demo
deno run -A main_hybrid.ts declarative --shout
deno run -A main_hybrid.ts declarative nested
```

---

## Core Concepts

### Progressive Context Refinement
One of the unique features of **cliffapp** is the ability to refine the application context at every level of the command hierarchy. 

1. **Global Parse**: Cliffy parses all options for the entire execution path.
2. **Cascading Refinement**: Starting from the root, each command's `refineContext` is called with those parsed options.
3. **Dynamic Subcommands**: If `subCommands` is a function, it is called *after* refinement, allowing you to dynamically show or hide subcommands based on earlier flags (e.g., hiding admin commands unless `--admin` is passed).

### Logging Integration
CliffApp integrates seamlessly with `@epdoc/logger`.
- Use `addLoggingOptions(cmd, ctx)` to automatically add `--log`, `--verbose`, etc.
- The `run` wrapper automatically handles `configureLogging` and error formatting.

## Development

```bash
# Check all demos for type safety
deno task check
```
