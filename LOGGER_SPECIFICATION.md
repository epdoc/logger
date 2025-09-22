# Logger Context Enhancement Specification

## Overview

This specification focuses on enhancing the context tracking capabilities of @epdoc/logger for server applications. The current architecture uses arrays for `reqIds` and `pkgs` which doesn't match typical server application patterns where each logger instance should track a single request and each log message comes from a single module.

## Current Architecture (Correct Understanding)

### MessageBuilder Role
MessageBuilder is **only for string formatting** of the `Entry.msg` field. It creates formatted strings with colors, styling, and structure. **Transports** handle the overall Entry serialization (JSON, plain text, etc.).

### Current Entry Structure
```typescript
export type Entry = {
  level: Level.Name;
  timestamp?: Date;
  sid?: string;        // ✅ Single session ID (correct)
  reqIds?: string[];   // ❌ Array doesn't match single-request use case  
  pkgs?: string[];     // ❌ Array doesn't match single-module use case
  msg: string | MsgBuilder.IFormatter | undefined;
  data?: unknown | undefined;
};
```

### Current Flow (from CLASSES.md)
```
Logger → LevelEmitter → Emitter → MsgBuilder → Emitter.emit() → TransportMgr → Transport
```

## Context Enhancement Requirements

### Server Application Use Case
```typescript
// Express.js middleware - each request gets its own logger
app.use((req, res, next) => {
  req.logger = logMgr.createLogger(req.session?.id, `req-${Date.now()}`);
  next();
});

// All logs in this request carry the same sid/reqId
req.logger.info.text('Processing user request').emit();

// Different modules specify their package context
// In api/users/controller.ts
req.logger.createEmitter('api/users/controller').info.text('Validating input').emit();

// In services/database.ts  
req.logger.createEmitter('services/database').debug.text('Executing query').emit();
```

### Expected Entry Output
```typescript
{
  level: 'info',
  timestamp: Date,
  sid: 'session-abc123',           // Single session ID
  reqId: 'req-1642789123456',      // Single request ID (not array)
  pkg: 'api/users/controller',     // Single package path (not array)
  msg: 'Formatted message string',
  data: {...}
}
```

## Implementation Roadmap

### Phase 1: Entry Interface Update
**Goal**: Change from arrays to single values for reqId and pkg

**Changes**:
```typescript
// Before
export type Entry = {
  reqIds?: string[];   // ❌ Remove array
  pkgs?: string[];     // ❌ Remove array
  sid?: string;        // ✅ Keep unchanged
  // ... other fields
};

// After
export type Entry = {
  reqId?: string;      // ✅ Single request ID
  pkg?: string;        // ✅ Single package path  
  sid?: string;        // ✅ Unchanged
  // ... other fields
};
```

**Files to update**:
- `packages/logger/src/types.ts` - Entry type definition
- All transport implementations to handle single values
- All examples and tests

### Phase 2: LogMgr Factory Enhancement
**Goal**: Add request-scoped logger creation

**Design Decision**: How should LogMgr create context-aware loggers?

**Analysis**: Looking at current architecture, LogMgr already has `getLogger()`. We need to add `createLogger(sid?, reqId?)` that creates a Logger instance with embedded context.

**Changes**:
```typescript
// In LogMgr class
createLogger(sid?: string, reqId?: string): Logger<T> {
  // Create logger instance with embedded context
  // This context flows to all Emitters created by this logger
}
```

**Files to update**:
- `packages/logger/src/logmgr.ts` - Add createLogger method
- Logger constructor to accept and store sid/reqId context

### Phase 3: Package Context in Emitters  
**Goal**: Add module/file context per log message

**Design Decision**: Where should package context be specified?

**Options**:
- **Option A**: `logger.createEmitter('pkg').info.text()` - pkg at emitter creation
- **Option B**: `logger.info.pkg('pkg').text()` - pkg per message
- **Option C**: `logger.pkg('pkg').info.text()` - pkg at logger level

**Analysis**: 
- Option A is cleanest - package context is typically constant within a code location
- Option B adds complexity to MsgBuilder interface
- Option C makes pkg logger-scoped instead of message-scoped

**Recommendation**: Option A - `logger.createEmitter(pkg)`

**Changes**:
```typescript
// In Logger class
createEmitter(pkg?: string): Emitter<T> {
  // Create emitter with package context
  // Emitter combines logger's sid/reqId with its own pkg
}
```

### Phase 4: Emitter Context Integration
**Goal**: Emitter builds Entry with combined context

**Changes**:
```typescript
// In Emitter class
emit(): void {
  const entry: Entry = {
    level: this.level,
    timestamp: new Date(),
    sid: this.logger.sid,      // From logger context
    reqId: this.logger.reqId,  // From logger context  
    pkg: this.pkg,             // From emitter context
    msg: this.msgBuilder.format(),
    data: this.data
  };
  this.transportMgr.emit(entry);
}
```

### Phase 5: Transport Updates
**Goal**: Update all transports to handle single-value context

**Changes**:
- Console transport: Format single reqId/pkg instead of arrays
- File transport: Handle single values in output format
- Logdy transport: Already updated to use single values
- Any custom transports

### Phase 6: Backward Compatibility & Migration
**Goal**: Smooth migration path for existing code

**Strategy**:
- Keep existing `getLogger()` method unchanged
- Add deprecation warnings for array access patterns
- Provide migration guide for common patterns

## Open Design Questions & Resolutions

### Q1: Should pkg be at Logger or Emitter level?
**Resolution**: Emitter level via `logger.createEmitter(pkg)` 
**Rationale**: Package context is message-specific, not logger-specific. A single logger (request) may log from multiple modules.

### Q2: How to maintain fluent interface?
**Current**: `logger.info.text('message').emit()`
**Enhanced**: `logger.createEmitter('pkg').info.text('message').emit()`
**Alternative**: Keep existing interface, add optional pkg method: `logger.info.pkg('pkg').text('message').emit()`

**Resolution**: Provide both patterns:
- `logger.createEmitter(pkg)` for explicit package context
- Keep existing `logger.info` for backward compatibility (pkg = undefined)

### Q3: Package path format?
**Resolution**: Use forward slashes like file paths: `'api/users/controller'`, `'services/database'`

### Q4: Context inheritance in child loggers?
**Current**: Child loggers inherit parent context
**Enhanced**: Child loggers should inherit sid/reqId but can override pkg per emitter

## Success Criteria

1. **Single-value context**: Entry uses `reqId?: string`, `pkg?: string` (not arrays)
2. **Request-scoped loggers**: `logMgr.createLogger(sid, reqId)` creates isolated context
3. **Package context**: Emitters can specify module context via `createEmitter(pkg)`
4. **Transport compatibility**: All transports handle new Entry format correctly
5. **Backward compatibility**: Existing `logger.info.text().emit()` continues to work
6. **Performance**: No significant overhead from context tracking

## Implementation Priority

**Phase 1** (Critical): Entry interface update - enables all other phases
**Phase 2** (High): LogMgr factory method - core functionality for server apps  
**Phase 3** (High): Package context in emitters - completes context system
**Phase 4** (High): Emitter context integration - makes it all work
**Phase 5** (Medium): Transport updates - ensures proper output formatting
**Phase 6** (Low): Migration support - helps adoption

This enhancement transforms @epdoc/logger from a general-purpose logger into a context-aware system ideal for server applications while preserving its MessageBuilder flexibility and transport architecture.
