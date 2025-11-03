# Gemini AI Instructions for @epdoc/logger

## Overview
This instruction set tells you how to reason about and use the documentation files in `/docs` for specific tasks related to the @epdoc/logger TypeScript logging library. Since you cannot read files by reference, key information from each documentation file is provided below.

## Project Context
@epdoc/logger is a TypeScript logging library with pluggable MessageBuilder formatting, multi-transport output, and context-aware logging for server applications. It uses a unique architecture with LogMgr, Logger, Emitter, MsgBuilder, and Transport components.

## Documentation Files and Their Usage

### [GETTING_STARTED.md](./docs/GETTING_STARTED.md) - New User Onboarding
**Use for**: Helping users set up their first logger, basic configuration, simple examples

**Key Content**:
- Creating LogMgr: `const logMgr = new Log.Mgr<M>()`
- Getting logger: `const logger = logMgr.getLogger<L>()`
- Basic logging: `logger.info.text('Hello World!').emit()`
- Setting thresholds: `logMgr.threshold = 'debug'`
- Adding transports: `logMgr.addTransport(transport)`

**When to reference**: User asks "how do I start", "basic setup", "first logger", "simple example"

### [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System Design and Components
**Use for**: Understanding system design, component relationships, advanced usage patterns

**Key Content**:
- Core classes: LogMgr (central manager), Logger (user interface), MsgBuilder (string formatting), Transports (output destinations)
- LogMgr methods: `getLogger<L>()`, `init()`, `threshold`, `show`, `addTransport()`
- Logger methods: Level methods (`error`, `warn`, `info`), `getChild()`, `mark()`, `demark()`, `set sid()`
- Emitter architecture: Logger → LevelEmitter → Emitter → MsgBuilder → Transport
- Entry structure: `{ level, timestamp, sid?, reqId?, pkg?, msg, data? }`
- Generic patterns: LogMgr takes MessageBuilder type, Logger type specified in getLogger()

**When to reference**: Questions about "how it works", "architecture", "components", "design patterns", "advanced usage"

### [CONFIGURATION.md](./docs/CONFIGURATION.md) - Settings and Options
**Use for**: Configuring logger behavior, transport settings, display options

**Key Content**:
- LogMgr configuration via constructor options
- Transport configuration (Console, File, etc.)
- Show options for controlling output metadata
- Threshold settings for filtering log levels
- Factory method configuration for different logger types

**When to reference**: "how to configure", "settings", "options", "customize behavior"

### [MsgBuilder README](./packages/msgbuilder/README.md) - Message Formatting
**Use for**: Creating formatted log messages, styling, colors, structured output

**Key Content**:
- MessageBuilder is for string formatting only (creates Entry.msg field)
- Fluent interface: `.text()`, `.value()`, `.h1()`, `.color()`, etc.
- Console formatting with colors and styles
- Performance timing with `.ewt()` method
- Conditional logging with `.if()`, `.elif()`, `.else()`

**When to reference**: "formatting messages", "colors", "styling", "structured output", "message building"

### [Log Levels README](./packages/loglevels/README.md) - Log Level Management
**Use for**: Understanding log levels, filtering, threshold behavior

**Key Content**:
- Standard levels: error, warn, info, verbose, debug, trace, spam
- CLI levels: error, warn, help, data, info, debug, prompt, verbose, input, silly
- Level filtering and threshold behavior
- Converting between level names and numeric values

**When to reference**: "log levels", "filtering", "thresholds", "severity"

### [PROGRESS.md](./PROGRESS.md) - Current Development Status
**Use for**: Understanding ongoing development, context enhancement features, implementation roadmap. This document will be absent if there is no ongoing development.

**When to reference**: "what's new", "upcoming features", "server applications", "context tracking", "development status"

## Task-Specific Guidance

### For Basic Setup Questions:
1. Start with [GETTING_STARTED.md](./docs/GETTING_STARTED.md) content
2. Reference [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for component explanations
3. Use [CONFIGURATION.md](./docs/CONFIGURATION.md) for customization options

### For Advanced Implementation:
1. Use [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design understanding
2. Reference [MsgBuilder README](./packages/msgbuilder/README.md) for message formatting
3. Check [PROGRESS.md](./PROGRESS.md), if it exists, for latest features

### For Server Applications:
1. Secondary: [PROGRESS.md](./PROGRESS.md) for implementation status
1. Supplement: [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for Logger methods

### For Troubleshooting:
1. [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for understanding component flow
2. [CONFIGURATION.md](./docs/CONFIGURATION.md) for settings issues
3. [GETTING_STARTED.md](./docs/GETTING_STARTED.md) for basic setup problems

## Code Examples Integration
When providing code examples, combine information from multiple docs:
- Use [GETTING_STARTED.md](./docs/GETTING_STARTED.md) patterns for basic structure
- Apply [ARCHITECTURE.md](./docs/ARCHITECTURE.md) knowledge for proper typing
- Include [MsgBuilder README](./packages/msgbuilder/README.md) techniques for formatting
- Reference [CONFIGURATION.md](./docs/CONFIGURATION.md) for proper setup

## Current Development Context
The library is actively developing various features (see  [PROGRESS.md](./PROGRESS.md), if it exists). Open issues that need to be resolved may also be found in [ISSUES.md](./ISSUES.md).

## Response Strategy
1. **Identify task type** from user question
2. **Select primary documentation** based on task
3. **Combine relevant information** from multiple docs
4. **Provide complete, working examples** using documented patterns
5. **Reference current development status** when relevant
