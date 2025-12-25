# Claude Code Project Guide - @epdoc/logger

This document provides essential context for Claude Code when working on the @epdoc/logger project.

## Project Overview

@epdoc/logger is a comprehensive TypeScript logging ecosystem with pluggable MessageBuilder formatting, multi-transport output, and CLI application integration.

## Essential Reference

**Important**: This repository has comprehensive AI guidance. See [AI.md](./AI.md) for detailed information on:
- Complete project architecture and component relationships
- Documentation structure and when to use each file
- Current development patterns (createLogManager, ContextBundle, BufferTransport)
- Task-specific guidance for setup, advanced implementation, and troubleshooting
- Code patterns and examples
- Package-specific documentation locations

## Quick Architecture

```
Logger → LevelEmitter → Emitter → MsgBuilder → Transport
```

Core classes: LogMgr, Logger, MsgBuilder, Transport, ContextBundle

## Development Setup

### Testing
- Use Deno `-A` option for permissions
- Run from package directory: `deno test -A`
- BufferTransport available for programmatic log inspection

### Publishing
- Published to JSR as `jsr:@epdoc/logger` and related packages
- Follow standard Deno publishing workflow

## Key Patterns (See <AI.md> for details)

### Recommended Setup
```typescript
const logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
const logger = logMgr.getLogger<AppLogger>();
```

### ContextBundle for Complex Apps
```typescript
type AppBundle = CliApp.Cmd.ContextBundle<AppContext, AppBuilder, AppLogger>;
```

## Important Notes
- **Always consult <AI.md>** for comprehensive guidance
- Use current patterns (createLogManager, ContextBundle)
- Demo project can be copied as it uses published JSR packages
- All packages have back-references to root documentation
