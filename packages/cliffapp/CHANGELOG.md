# Changelog for @epdoc/cliffapp

All notable changes to this project will be documented in this file.

## [0.2.2] - 2026-02-03

- Updated dependencies

## [0.2.1] - 2026-02-02

- Declared version 0.1.0

## [0.1.9] - 2026-02-02

- Updated documentation

## [0.1.8] - 2026-02-02

### ARCHITECTURE NOTES
- **Staged Initialization Required**: The `init()` process is broken into stages because options must be declared before parsing, but parsed options are needed to create child contexts and configure subcommands
- **Options Flow Down Tree**: Root options (like `--api-url`, `--host`) are parsed first, then used to create specialized contexts (like `HostCtx`) that flow down to child commands
- **Context Refinement**: Each command level can refine the context using `deriveChildContext()` based on the options it receives, allowing progressive specialization as you go deeper in the command tree
- **Cliffy Constraint**: This staged approach is necessitated by Cliffy's requirement that options be declared before parsing, while still allowing dynamic subcommand configuration based on parsed parent options

### BREAKING CHANGES
- **Removed `abstract` keyword from `AbstractCmd`** - Now a concrete class that can be instantiated directly
- **Eliminated `DeclarativeCommand` class** - No longer needed, use `new AbstractCmd(node)` instead
- **Removed `CommandEngine` class** - Use `AbstractCmd` directly or the new static methods
- **Made `setContext()` and `init()` async** - Both methods now return `Promise<void>`
- **Fixed circular dependency** - Removed `AbstractCmd` import from `types.ts`

### NEW FEATURES
- **Unified command architecture** - Single `AbstractCmd` class handles both class-based and declarative patterns
- **Constructor-based declarative support** - Pass `CommandNode` to constructor: `new AbstractCmd(node)`
- **Enhanced type safety** - Better generic constraints and validation
- **Improved naming** - `deriveChildContext`, `configureGlobalHooks` for clarity

### IMPROVEMENTS
- **Simplified API** - Fewer classes and concepts to understand
- **Better error handling** - Enhanced context access safety
- **Fixed option naming** - Changed `--log` to `--log-level` with proper EnumType validation
- **Updated logging configuration** - Now accepts `Partial<GlobalOptions>` for flexibility

### FIXES
- **Context timing issues** - Proper initialization order for declarative commands
- **Test compatibility** - All tests updated and passing
- **Demo applications** - All three demo variations (class, declarative, hybrid) working

### MIGRATION GUIDE
- Replace `new DeclarativeCommand(node)` with `new AbstractCmd(node)`
- Replace `new CommandEngine(ctx).run(tree)` with direct `AbstractCmd` usage
- Add `await` to `setContext()` and `init()` calls
- Update `--log` usage to `--log-level`

## [0.1.7] - 2026-02-02

- Snapshot

## [0.1.4] - 2026-02-01

- Added support for declarative command specification

## [0.1.3] - 2026-01-30

- Added DenoPkg declaration

## [0.1.2] - 2026-01-28

- Fixed run function which was not fully developed.
- Split old command.ts file into parts.
- Fixed unit tests by adding an optional parameter to the run method that is only set for testing.

## [0.1.1] - 2026-01-28,,- updated dependencies
