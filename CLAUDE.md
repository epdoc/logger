# Claude Code Project Guide - @epdoc/logger

This document provides essential context for Claude Code when working on the @epdoc/logger project.

## Project Overview

@epdoc/logger is a TypeScript logging library with pluggable MessageBuilder formatting, multi-transport output, and context-aware logging for server applications. It uses a unique architecture with LogMgr, Logger, Emitter, MsgBuilder, and Transport components.

**Important**: This repository has comprehensive documentation. See [GEMINI.md](./GEMINI.md) for detailed guidance on:
- Which documentation files to reference for specific tasks
- Architecture and component relationships
- Configuration and setup patterns
- Code examples and usage patterns

## Quick Architecture Overview

The library uses this component flow:
```
Logger → LevelEmitter → Emitter → MsgBuilder → Transport
```

### Core Classes
- **LogMgr**: Central manager for loggers and transports
- **Logger**: User interface for logging
- **MsgBuilder**: String formatting and message construction
- **Transport**: Output destinations (Console, File, etc.)

### Packages in this Monorepo
- `logger` - Core logging framework
- `msgbuilder` - Message formatting
- `loglevels` - Log level management
- (other related packages)

## Development Patterns

### Basic Usage Pattern
```typescript
const logMgr = new Log.Mgr<M>();
const logger = logMgr.getLogger<L>();
logger.info.text('Hello World!').emit();
```

### For Detailed Information
Always refer to [GEMINI.md](./GEMINI.md) which provides:
- Task-specific guidance (setup, advanced implementation, troubleshooting)
- Complete documentation file reference
- When to use which documentation
- Current development context

## Testing
- Use Deno `-A` option for read, write, sys, and env permissions
- Run tests from package directory: `deno test -A`

## Publishing
- Published to JSR as `jsr:@epdoc/logger` (and related packages)
- Follow standard Deno publishing workflow

## Important Notes
- When working on this project, **always consult [GEMINI.md](./GEMINI.md)** for task-specific documentation guidance
- Check [PROGRESS.md](./PROGRESS.md) if it exists for current development status
- Check [ISSUES.md](./ISSUES.md) for known issues
- Review individual package README files in `./packages/` for package-specific details
