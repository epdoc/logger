# Context Enhancement Implementation Progress

## Goal
Transform @epdoc/logger into a context-aware logging system suitable for server applications by changing from array-based context (`reqIds[]`, `pkgs[]`) to single-value context (`reqId`, `pkg`) that matches real-world usage patterns.

## What We're Achieving

### Current State
- **Entry context**: Uses arrays `reqIds?: string[]`, `pkgs?: string[]` 
- **Logger creation**: Only `logMgr.getLogger()` - no request-scoped loggers
- **Package context**: No way to specify which module generated a log message
- **Server apps**: Must manually manage context, no built-in request correlation

### Target State  
- **Entry context**: Single values `reqId?: string`, `pkg?: string`
- **Request-scoped loggers**: `logMgr.createLogger(sid, reqId)` creates isolated context
- **Package context**: `logger.createEmitter('api/users/service')` specifies module
- **Server apps**: Built-in request correlation and module tracking

### Use Case Example
```typescript
// Express.js middleware
app.use((req, res, next) => {
  req.logger = logMgr.createLogger(req.session?.id, `req-${Date.now()}`);
  next();
});

// In api/users/controller.ts
req.logger.createEmitter('api/users/controller').info
  .text('Processing user request')
  .value('userId', req.params.id)
  .emit();

// Results in Entry:
{
  level: 'info',
  sid: 'session-abc123',
  reqId: 'req-1642789123456', 
  pkg: 'api/users/controller',
  msg: 'Processing user request userId=123',
  timestamp: Date,
  data: {...}
}
```

## Implementation Steps

### ✅ Phase 0: Analysis & Planning (COMPLETED)
- [x] Analyze current Entry structure in `types.ts`
- [x] Review CLASSES.md architecture documentation  
- [x] Understand MessageBuilder vs Transport roles
- [x] Create implementation specification
- [x] Identify files requiring updates

### 🔄 Phase 1: Entry Interface Update (IN PROGRESS)
**Goal**: Change Entry from arrays to single values

**Tasks**:
- [ ] Update `packages/logger/src/types.ts`:
  - Change `reqIds?: string[]` → `reqId?: string`
  - Change `pkgs?: string[]` → `pkg?: string`
  - Keep `sid?: string` unchanged
- [ ] Update all transport implementations:
  - [ ] Console transport - handle single reqId/pkg
  - [ ] File transport - handle single reqId/pkg  
  - [x] Logdy transport - already updated
- [ ] Update examples to use new Entry format
- [ ] Update tests for new Entry structure

**Files to modify**:
- `packages/logger/src/types.ts`
- `packages/logger/src/transports/console.ts`
- `packages/logger/src/transports/file.ts`
- `packages/examples/*.ts`
- Test files

### 📋 Phase 2: LogMgr Factory Enhancement (PLANNED)
**Goal**: Add request-scoped logger creation

**Tasks**:
- [ ] Add `createLogger(sid?, reqId?)` method to LogMgr class
- [ ] Update Logger constructor to accept and store sid/reqId context
- [ ] Ensure Logger passes context to Emitters
- [ ] Add tests for request-scoped logger creation
- [ ] Update documentation with new factory method

**Files to modify**:
- `packages/logger/src/logmgr.ts`
- Logger class files
- Test files
- Documentation

### 📋 Phase 3: Package Context in Emitters (PLANNED)  
**Goal**: Add module/file context per log message

**Tasks**:
- [ ] Add `createEmitter(pkg?: string)` method to Logger class
- [ ] Update Emitter to store and use package context
- [ ] Ensure Emitter combines logger context (sid/reqId) with emitter context (pkg)
- [ ] Add tests for package context functionality
- [ ] Update examples to demonstrate package context

**Files to modify**:
- Logger class files
- `packages/logger/src/emitter.ts`
- Example files
- Test files

### 📋 Phase 4: Emitter Context Integration (PLANNED)
**Goal**: Emitter builds Entry with combined context

**Tasks**:
- [ ] Update Emitter.emit() to build Entry with:
  - `sid` from logger context
  - `reqId` from logger context  
  - `pkg` from emitter context
- [ ] Ensure proper context flow: Logger → Emitter → Entry → Transport
- [ ] Add comprehensive tests for context integration
- [ ] Verify all context combinations work correctly

**Files to modify**:
- `packages/logger/src/emitter.ts`
- Test files

### 📋 Phase 5: Transport Updates (PLANNED)
**Goal**: Ensure all transports handle single-value context

**Tasks**:
- [ ] Update Console transport formatting for single reqId/pkg
- [ ] Update File transport formatting for single reqId/pkg
- [ ] Verify Logdy transport works with new format (already done)
- [ ] Test all transports with new Entry structure
- [ ] Update transport documentation

**Files to modify**:
- Transport implementation files
- Transport tests
- Documentation

### 📋 Phase 6: Backward Compatibility & Migration (PLANNED)
**Goal**: Smooth migration path for existing code

**Tasks**:
- [ ] Keep existing `getLogger()` method unchanged
- [ ] Add deprecation warnings for array-based access patterns
- [ ] Create migration guide for common usage patterns
- [ ] Provide compatibility shims if needed
- [ ] Update all examples to use new patterns

**Files to modify**:
- Documentation files
- Migration guide
- Example files

## Success Metrics

### Functional Requirements
- [ ] Entry uses single values: `reqId?: string`, `pkg?: string`
- [ ] `logMgr.createLogger(sid, reqId)` creates request-scoped loggers
- [ ] `logger.createEmitter(pkg)` adds package context
- [ ] All transports handle new Entry format correctly
- [ ] Existing `logger.info.text().emit()` continues to work

### Quality Requirements  
- [ ] No performance regression from context tracking
- [ ] Type safety maintained throughout
- [ ] Comprehensive test coverage for new features
- [ ] Clear documentation and examples
- [ ] Smooth migration path for existing users

## Current Status
**Phase 1 - Entry Interface Update**: Ready to begin implementation
**Next Action**: Update `packages/logger/src/types.ts` Entry type definition

## Notes
- MessageBuilder handles only string formatting of Entry.msg field
- Transports handle overall Entry serialization (JSON, text, etc.)
- Context enhancement is additive - existing functionality preserved
- Focus on server application use cases while maintaining general-purpose flexibility
