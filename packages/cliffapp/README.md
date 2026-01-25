# @epdoc/cliffapp

A standard bridge between [@epdoc/logger](https://jsr.io/@epdoc/logger) and [deno-cliffy](https://github.com/c4spar/deno-cliffy).

This module provides a standardized way to add logging options to Cliffy applications, automatically configure the logger based on those options, and wrap the application lifecycle with logging and error handling.

## Features

- **Standardized CLI Flags**: Adds `--log`, `--verbose`, `--debug`, `--dry-run`, and more.
- **Automatic Configuration**: Maps CLI flags directly to `@epdoc/logger` status and levels.
- **Run Wrapper**: A logic-heavy wrapper that handles initialization, global actions, error reporting (including `SilentError`), and graceful shutdown.
- **Type Safe**: Full TypeScript support with generic builders and loggers.

## Installation

```json
{
  "imports": {
    "@epdoc/cliffapp": "jsr:@epdoc/cliffapp@^0.0.1"
  }
}
```

## Usage

### 1. Define your Context

The context holds your package information, logger instance, and state like `dryRun`.

```typescript
import { Logger, MsgBuilder, ICtx } from "@epdoc/cliffapp";
import { LogManager } from "@epdoc/logger";

const logMgr = new LogManager();
const logger = logMgr.getLogger("main");

const ctx: ICtx = {
  log: logger,
  logMgr: logMgr,
  dryRun: false,
  pkg: {
    name: "my-app",
    version: "1.0.0",
    description: "My awesome Cliffy app"
  },
  close: async () => {
    // Cleanup logic here
  }
};
```

### 2. Define your Command

Use `addLoggingOptions` to inject the standardized global options into your Cliffy command.

```typescript
import { Command } from "@cliffy/command";
import { addLoggingOptions } from "@epdoc/cliffapp";

const command = new Command()
  .name("my-app")
  .version("1.0.0")
  .description("My awesome Cliffy app");

// Add standard logging options
addLoggingOptions(command, ctx);

// Add your subcommands and actions
command.command("hello", "Say hello")
  .action(() => {
    ctx.log.info.text("Hello, World!").emit();
  });
```

### 3. Run the Application

Use the `run` wrapper to execute your command. **The `run` function automatically adds a global action to your command** that calls `configureLogging` before any subcommand action is executed. This ensures the logger is configured based on the user-provided CLI flags.

```typescript
import { run } from "@epdoc/cliffapp";

if (import.meta.main) {
  await run(ctx, command);
}
```

> [!NOTE]
> If you prefer not to use the `run` wrapper, you must manually call `configureLogging(ctx, opts)` within your command's action or a pre-action hook.

## Standard Options Added

When you call `addLoggingOptions`, the following global options are added:

| Option | Description |
| --- | --- |
| `--log <level>` | Set the threshold log output level (debug, info, warn, error, etc.) |
| `--log-show <list>` | Enable specific log message components (level, time, pkg, all) |
| `--no-color` | Disable color in output |
| `-A, --showall` | Shortcut for `--log-show all` |
| `-v, --verbose` | Shortcut for `--log verbose` |
| `-D, --debug` | Shortcut for `--log debug` |
| `-T, --trace` | Shortcut for `--log trace` |
| `-S, --spam` | Shortcut for `--log spam` |
| `-n, --dry-run` | Sets `ctx.dryRun = true`. Use this for safe execution tests. |

## Error Handling

### SilentError

If you want to throw an error that displays a message but **not** a full stack trace, use `SilentError`:

```typescript
import { SilentError } from "@epdoc/cliffapp";

throw new SilentError("Something went wrong, but don't panic!");
```
