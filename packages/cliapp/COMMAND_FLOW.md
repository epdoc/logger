# Command Execution Flow

This document describes the complete lifecycle of command execution in cliapp, from initialization to execution.

## Key Constraint

**Commander.js requires all options to be declared before parsing.** Unlike Cliffy, you cannot dynamically add options
based on parsed values. This means:

- All command and subcommand options must be set up during initialization
- Context derivation happens at execution time, not setup time
- Subcommand options cannot depend on parent's parsed options

## Initialization Phase (Setup Time)

### 1. Main Entry Point

```typescript
// User code in main
const rootCtx = new RootContext(pkg);
await rootCtx.setupLogging();

const rootCmd = new RootCommand(pkg);
await rootCmd.init(rootCtx);

await CliApp.run(rootCtx, rootCmd);
```

### 2. Root Command Initialization (`rootCmd.init(rootCtx)`)

The `init()` method orchestrates setup in this order:

```typescript
async init(ctx: Context): Promise<this> {
  this._ctx = ctx;
  this._isRoot = !this.parent;
  
  // Set pkg metadata (name, version, description)
  // Configure help and output
  
  this.setupOptions();           // Step 3
  this.configureGlobalHooks();   // Step 4
  await this.setupSubcommands(); // Step 5
  this.setupAction();            // Step 6
  
  return this;
}
```

### 3. Setup Options (`setupOptions()`)

```typescript
protected setupOptions(): void {
  this.setupCommandOptions();  // User-defined options
  
  if (this.node) {
    this.setupFromNode();      // Declarative config
  }
  
  if (this._isRoot) {
    this.addLogging();         // Add --log-level, --debug, etc.
  }
}
```

**User overrides `setupCommandOptions()`:**

```typescript
class RootCommand extends Command<RootContext, RootOptions, ChildContext> {
  protected override setupCommandOptions(): void {
    this.option('--debug-mode', 'Enable debug mode');
  }
}
```

### 4. Configure Global Hooks (`configureGlobalHooks()`)

Currently empty, available for override. Could be used for:

- Pre-action hooks
- Post-action hooks
- Validation hooks

### 5. Setup Subcommands (`setupSubcommands()`)

For each subcommand:

```typescript
protected async setupSubcommands(): Promise<void> {
  for (const [name, Entry] of Object.entries(this.subCommands)) {
    // Create subcommand instance
    const child = new Entry(this.ctx.pkg);
    child.name(name);
    
    // Initialize subcommand WITHOUT context (just for options setup)
    // TODO: This needs to be fixed - we shouldn't need context here
    await child.init(???);
    
    // Wrap action to derive context at execution time
    child.action(async (...args) => {
      // Derive child context from parent context + child options
      const childOpts = child.opts();
      const childCtx = await this.deriveChildContext(this.ctx, childOpts, args);
      (child as any)._ctx = childCtx;
      
      await child.execute(childOpts, args);
    });
    
    this.addCommand(child);
  }
}
```

**Problem:** Currently we're calling `child.init(ctx)` which requires context, but we don't need context to set up
options. We need to refactor this.

### 6. Setup Action (`setupAction()`)

```typescript
protected setupAction(): void {
  this.action(async (...args: unknown[]) => {
    const opts = this.opts() as Options;
    const cmdArgs = args as string[];
    await this.execute(opts, cmdArgs);
  });
}
```

## Parsing Phase (Commander.js)

### 7. Parse Arguments (`run()` calls `command.parseAsync()`)

Commander.js:

1. Parses command line arguments
2. Matches options to registered options
3. Identifies which command to execute (root or subcommand)
4. Calls the appropriate action handler

## Execution Phase (Runtime)

### 8. Root Command Execution

If no subcommand specified:

```typescript
// Commander.js calls the action we registered in setupAction()
action(async (...args) => {
  const opts = this.opts(); // { debugMode: true, logLevel: 'DEBUG', ... }
  const cmdArgs = args; // []
  await this.execute(opts, cmdArgs);
});
```

**User's `execute()` method:**

```typescript
class RootCommand extends Command<RootContext, RootOptions, ChildContext> {
  protected override execute(opts: RootOptions) {
    // Attach parsed options to context
    this.ctx.debugMode = opts.debugMode;
  }
}
```

### 9. Subcommand Execution

**IMPORTANT:** When a subcommand is invoked, Commander.js:

- Parses parent options and makes them available via `parent.opts()`
- **Does NOT call the parent's action**
- Only calls the subcommand's action

Example: `program --parent-opt value child --child-opt value`

```typescript
// Commander.js calls the subcommand's action we registered in setupSubcommands()
child.action(async (...args) => {
  // At this point:
  // - Parent's execute() has NOT run (parent action is skipped)
  // - Parent's options are available via parent.opts()
  // - We need to derive child context from parent context + parent opts + child opts

  const parentOpts = this.opts(); // Parent's parsed options
  const childOpts = child.opts(); // { force: true }
  const childArgs = args; // ['file1.txt']

  // Derive child context from parent context + parent opts + child opts
  const childCtx = await this.deriveChildContext(this.ctx, parentOpts, childOpts, childArgs);
  (child as any)._ctx = childCtx;

  await child.execute(childOpts, childArgs);
});
```

**User's subcommand `execute()` method:**

```typescript
class SubCommand extends Command<ChildContext, SubOptions, ChildContext> {
  override execute(opts: SubOptions, files: CmdArgs) {
    // Access parent state from context (derived from parent opts)
    this.ctx.log.debug.label('Debug mode:').value(this.ctx.debugMode).emit();

    // Use child options
    if (opts.force) {
      // Force processing
    }

    // Update child context
    this.ctx.processedFiles = files.length;
  }
}
```

## Context Flow

```
RootContext (created in main)
  ↓
RootCommand.init(rootCtx)
  ↓ (setupOptions, setupSubcommands, setupAction)
  ↓
Commander.js parses args
  ↓
IF root command only:
  RootCommand.execute(rootOpts)
    ↓ (attaches rootOpts to rootCtx)

IF subcommand:
  SubCommand action triggered
    ↓
  Get parent opts: parent.opts()
    ↓
  deriveChildContext(rootCtx, parentOpts, childOpts, childArgs) → ChildContext
    ↓
  SubCommand.execute(childOpts, childArgs)
```

## Open Issues

1. **Subcommand initialization requires context** - Currently `setupSubcommands()` calls `child.init(ctx)` but we don't
   need context to set up options. Need to refactor to separate option setup from context initialization.

2. **deriveChildContext signature** - Currently takes `(ctx, opts, args)`. Should be
   `(ctx, parentOpts, childOpts, childArgs)` since:
   - Parent's action doesn't run when subcommand is invoked
   - Parent opts need to be explicitly passed to derive child context
   - Child opts are needed to configure child context

3. **Parent execute() never runs for subcommands** - The parent's `execute()` method is designed to attach options to
   context, but it never runs when a subcommand is invoked. We need to handle parent option attachment in
   `deriveChildContext()` instead.
