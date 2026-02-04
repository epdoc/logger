# CliffApp Command Reusability Enhancement

## Problem Statement
Commands needed to be duplicated to work as both root commands (with logging options) and subcommands (without logging options), leading to code duplication and maintenance issues.

## Solution Architecture

### 1. CommandMode Enum (types.ts)
```typescript
export enum CommandMode {
  ROOT = 'root',        // Always acts as root
  SUBCOMMAND = 'subcommand', // Always acts as subcommand  
  AUTO = 'auto'         // Auto-detects based on context
}
```

### 2. Enhanced Command Class (command.ts)

#### New Properties
- `#mode: CommandMode = CommandMode.AUTO` - Execution mode
- `#isRoot: boolean = false` - Whether command is acting as root

#### New Methods
- `setMode(mode: CommandMode): this` - Set execution mode
- `#determineIsRoot(opts): boolean` - Auto-detect root vs subcommand
- `setupCommandOptions(): void` - Command-specific options (override this)
- `#shouldAddLoggingOptions(): boolean` - Check if logging options needed

#### Modified Methods
- `setContext()` - Now determines root status and marks subcommands
- `setupOptions()` - Split into command options + conditional logging options
- `init()` - Marks child commands as subcommands with `_isSubcommand` flag

### 3. Subcommand Detection
- Root commands: `opts._isSubcommand` is undefined/false
- Subcommands: `opts._isSubcommand` is true (set by parent during registration)
- Auto-detection works at any nesting level

## Usage Patterns

### Class-Based Commands
```typescript
export class MyCommand extends Command<Context> {
  protected override setupCommandOptions(): void {
    // Define options, arguments, description
    // Logging options added automatically for root commands
  }
  
  protected override setupAction(): void {
    // Define action logic
    // Logging configured automatically for root commands
  }
}

// As root: new MyCommand().setMode(CommandMode.ROOT)
// As subcommand: new MyCommand().setMode(CommandMode.SUBCOMMAND)  
// Auto-detect: new MyCommand() // Recommended
```

### Declarative Commands
```typescript
const myCmd: CommandNode<Context> = {
  description: "My command",
  options: { "--flag": "Description" },
  action: (ctx, opts) => {
    // Logging already configured if root command
  }
};
```

## Benefits

1. **Eliminates Duplication** - Single command class works as both root and subcommand
2. **Automatic Logging Management** - Framework handles logging options and configuration
3. **Flexible Nesting** - Commands can be nested at any level
4. **Backward Compatible** - Existing commands continue to work
5. **Clear Separation** - Command logic separate from framework concerns

## Migration Path

1. **Existing Commands** - Continue to work unchanged
2. **New Commands** - Override `setupCommandOptions()` instead of `setupOptions()`
3. **Reusable Commands** - Use `setMode()` or rely on auto-detection
4. **Remove Duplication** - Replace separate root/sub command classes with single reusable class

This enhancement enables the modular command framework where packages like fsdate can be developed once and reused across multiple CLI applications.
