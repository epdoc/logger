# AI Instructions for @epdoc/logger

## Project Overview
@epdoc/logger is a comprehensive TypeScript logging ecosystem with pluggable MessageBuilder formatting, multi-transport output, and CLI application integration. It uses a unique architecture with LogMgr, Logger, Emitter, MsgBuilder, and Transport components.

## Architecture Overview
The library uses this component flow:
```
Logger → LevelEmitter → Emitter → MsgBuilder → Transport
```

### Core Classes
- **LogMgr**: Central manager for loggers and transports
- **Logger**: User interface for logging with level methods
- **MsgBuilder**: String formatting and message construction
- **Transport**: Output destinations (Console, File, Buffer, etc.)
- **ContextBundle**: Type management pattern for complex applications

## Documentation Structure

### [GETTING_STARTED.md](./GETTING_STARTED.md) - New User Onboarding
**Use for**: Basic setup, first logger, simple examples

**Key Patterns**:
- Helper function: `Log.createLogManager(Builder, options)`
- Custom builders: `Console.extender({ customMethod() { ... } })`
- Type setup: `type AppLogger = Log.Std.Logger<InstanceType<typeof AppBuilder>>`
- CLI integration with `@epdoc/cliapp`

**When to reference**: "how do I start", "basic setup", "first logger", "simple example"

### [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical Deep-dive
**Use for**: System design, component relationships, advanced patterns

**Key Content**:
- Component responsibilities and relationships
- ContextBundle pattern for type management
- Performance timing with `mark()` and `ewt()`
- Entry structure: `{ level, timestamp, sid?, reqId?, pkg?, msg, data? }`
- Transport types: Console, File, Buffer (testing), Custom

**When to reference**: "how it works", "architecture", "components", "design patterns", "advanced usage"

### [CONFIGURATION.md](./CONFIGURATION.md) - Advanced Configuration
**Use for**: Detailed configuration, custom setups, migration patterns

**Key Content**:
- LogMgr configuration options
- Custom message builder patterns
- CLI application integration
- Performance and context tracking
- Migration from complex setups

**When to reference**: "how to configure", "settings", "options", "customize behavior"

## Package-Specific Documentation

### Core Packages
- **[packages/logger/](./packages/logger/)** - Core logging functionality
- **[packages/msgbuilder/](./packages/msgbuilder/)** - Message formatting
- **[packages/cliapp/](./packages/cliapp/)** - CLI application framework
- **[packages/loglevels/](./packages/loglevels/)** - Log level management

### Examples and References
- **[packages/demo/](./packages/demo/)** - Complete CLI app showcase
- **[packages/examples/](./packages/examples/)** - Focused usage examples

## Current Development Context

### Recent Major Features
- **createLogManager()** helper function for simplified setup
- **BufferTransport** for testing and programmatic log inspection
- **ContextBundle** pattern for type management in complex applications
- **CLI integration** with structured command patterns

### Version Information
- **Version 1000.0.0+** indicates major rewrite incompatible with prior versions
- Current versions: logger v1003.1.0-alpha.4, cliapp v1.1.0-alpha.11

## Task-Specific Guidance

### For Basic Setup Questions:
1. Start with [GETTING_STARTED.md](./GETTING_STARTED.md) patterns
2. Use `createLogManager()` helper for simple setups
3. Reference [packages/demo/](./packages/demo/) for complete examples

### For Advanced Implementation:
1. Use [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Apply ContextBundle pattern for complex type management
3. Reference [CONFIGURATION.md](./CONFIGURATION.md) for advanced patterns

### For CLI Applications:
1. Use [packages/cliapp/](./packages/cliapp/) for framework details
2. Reference [packages/demo/](./packages/demo/) for complete CLI example
3. Apply ContextBundle pattern for type safety

### For Testing:
1. Use BufferTransport for programmatic log inspection
2. Reference [packages/examples/](./packages/examples/) for test patterns
3. Use Deno `-A` option for permissions

### For Troubleshooting:
1. [ARCHITECTURE.md](./ARCHITECTURE.md) for component flow understanding
2. [CONFIGURATION.md](./CONFIGURATION.md) for setup issues
3. [GETTING_STARTED.md](./GETTING_STARTED.md) for basic problems

## Code Patterns

### Recommended Setup Pattern
```typescript
// 1. Define custom builder (once per project)
const AppBuilder = Console.extender({
  apiCall(method: string, endpoint: string) {
    return this.text(`[API] ${method} ${endpoint}`);
  }
});

// 2. Create type alias (once per project)
type AppLogger = Log.Std.Logger<InstanceType<typeof AppBuilder>>;

// 3. Simple setup
const logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
const logger = logMgr.getLogger<AppLogger>();

// 4. Use everywhere
logger.info.apiCall('GET', '/users').emit();
```

### ContextBundle Pattern (Complex Apps)
```typescript
type AppBundle = CliApp.Cmd.ContextBundle<AppContext, AppBuilder, AppLogger>;

class ProcessCmd extends CliApp.Cmd.Sub<AppBundle, ProcessOptions> {
  // Reduces generic parameters from 4 to 2
}
```

## Response Strategy
1. **Identify task type** from user question
2. **Select primary documentation** based on task
3. **Use current patterns** (createLogManager, ContextBundle, etc.)
4. **Provide complete examples** using documented patterns
5. **Reference demo/examples** for complex scenarios

## Important Notes
- Always use `createLogManager()` for new setups
- Prefer ContextBundle pattern for complex applications
- BufferTransport is available for testing
- Demo project uses published JSR packages and can be copied
- All packages have back-references to root documentation
