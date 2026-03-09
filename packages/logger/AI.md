# @epdoc/logger -- AI Reference

A structured logging framework with support for multiple transports (console, file, InfluxDB), hierarchical loggers, and chainable message builders.

**Purpose**: Provide a flexible, performant logging system with the following design goals:
1. **Decoupled architecture**: MsgBuilder, Logger, LogMgr, TransportMgr are separate concerns
2. **Direct MsgBuilder→Transport flow**: MsgBuilder emits directly to TransportMgr, bypassing intermediate layers for performance
3. **Transport-determined thresholds**: Only transports have thresholds; loggers do not
4. **Per-call context**: Emitter carries sid/reqId/pkg context for the current log call

---

## External Dependencies

| Import | Used For |
|--------|----------|
| `@epdoc/loglevels` | Log level definitions (Spec, LogLevels) and severity comparison |
| `@epdoc/msgbuilder` | Chainable message building (Console.Builder, AbstractMsgBuilder, IEmitter) |
| `@epdoc/duration` | HrMilliseconds type for elapsed time |
| `@epdoc/type` | Type guards, Integer type, CompareResult |
| `@epdoc/datetime` | Date formatting utilities |
| `@std/fmt/colors` | ANSI color functions |
| `@std/assert` | Assertions |

---

## Core Architecture

### Data Flow

```
User code: logger.info.h1('Title').value(123).emit()
                    |
        +-----------+-----------+
        |                       |
        v                       v
   IndentLogger            (child loggers)
   .getIndentedMsgBuilder()  .getMsgBuilder() via parent
        |
        v
   LogMgr.getMsgBuilder('INFO', logger)
   - Creates MsgEmitter (captures context)
   - Calls msgBuilderFactory(MsgEmitter)
        |
        v
   MsgBuilder (e.g., Console.Builder)
   - Accumulates message parts
   - On .emit(): checks emitEnabled, packages as IFormatter
        |
        v
   MsgEmitter.emit(EmitterData)
   - Creates Entry with context + formatter
   - Calls TransportMgr.emit(Entry) DIRECTLY
        |
        v
   TransportMgr.emit(Entry)
   - Computes flush flag (level >= flushLevel.severity)
   - Queues if not all transports ready
   - Calls transport.emit(Entry) for each transport
        |
        v
   AbstractTransport.emit(Entry)
   - Calls emitFilter(): checks enabled && level >= threshold && timestamp
   - Formats Entry using Entry.msg.format()
   - Outputs via transport-specific output()
```

### Key Classes and Roles

| Class | File | Role |
|-------|------|------|
| `LogMgr` | `logmgr.ts` | Central manager. Owns TransportMgr. Creates loggers. Provides threshold default. Routes Entry objects to TransportMgr (used for direct emits, not MsgBuilder flow). |
| `MsgEmitter` | `msg-emitter.ts` | Per-call lightweight emitter. Created by LogMgr for each message. Captures logger context (sid, reqId, pkgs). Implements IEmitter interface for MsgBuilder. Emits Entry directly to TransportMgr. |
| `TransportMgr` | `transports/mgr.ts` | Owns transport collection. Manages queue when transports not ready. Distributes Entry to all transports. Computes flush flag. |
| `AbstractTransport` | `transports/base/transport.ts` | Base for all transports. Has threshold, show opts, emitFilter(). Actual output in subclasses. |
| `AbstractLogger` | `loggers/base/logger.ts` | Base logger. No threshold (removed). Manages context (sid, reqId, pkgs). Has mark()/demark() for EWT. |
| `IndentLogger` | `loggers/indent/logger.ts` | Adds indent/outdent/nodent. Overrides emit() to apply indentation. **Uses Entry.transports for direct emit calls**. |
| `StdLogger` / `CliLogger` / etc. | `loggers/*/` | Add level-specific getters (info, warn, error, etc.). |
| `Entry` | `types.ts` | Data structure passed through the system. Contains level, timestamp, msg (formatter), context, **transports: TransportMgr**. |

---

## Log Level Handling

### Threshold Philosophy

Per the design goals:
- **NO per-logger thresholds** — removed from all loggers
- **LogMgr.threshold** is the DEFAULT for new transports
- **Transports have individual thresholds** — can override default
- **Threshold set on LogMgr ripples to all transports** via `transportMgr.setThreshold()`

### Severity Numbers (OTLP-based)

LogLevels uses OTLP severity numbers (1-24). Key positions:
- Severity 1-8: Trace/Debug/Verbose
- Severity 9: INFO (default level)
- Severity 13: WARN
- Severity 17: ERROR (flush level)
- Severity 21+: FATAL/CRITICAL

Comparison: higher severity = more important. A message is emitted if `level.severity >= transport.threshold.severity`.

### Flush Threshold

TransportMgr computes flush flag: `level.severity >= logLevels.flushLevel.severity` (flushLevel is at severity 17, ERROR). If true, `transport.flush()` is called after emit.

---

## Type Reference

### Entry (types.ts)

```typescript
type Entry = {
  level: Level.Spec;           // Full Spec object with name, severity, fmtFn, icon
  timestamp?: Date;
  time?: HrMilliseconds;       // Elapsed wall time for EWT
  sid?: string;
  reqId?: string;
  pkg?: string;
  msg: string | IFormatter | undefined;  // Formatter is the MsgBuilder itself
  data?: unknown;
  msgSep?: Integer;            // Spaces between message parts
  transports: TransportMgr;    // Reference to transport manager (for IndentLogger)
};
```

### IEmitter (from @epdoc/msgbuilder)

Implemented by MsgEmitter:

```typescript
interface IEmitter {
  dataEnabled: boolean;        // Should MsgBuilder process data payloads?
  emitEnabled: boolean;        // Should MsgBuilder call emit()?
  stackEnabled: boolean;       // Should MsgBuilder generate stack traces?
  emit: (data: EmitterData) => EmitterData;
  demark?: (name: string, keep?: boolean) => number;  // For EWT timing
}

type EmitterData = {
  timestamp: Date;
  formatter: IFormatter;       // The MsgBuilder (implements format())
  data: Dict | undefined;
  elapsed: HrMilliseconds;
};
```

### LogEmitterOpts (types.ts)

Options for creating MsgEmitter:

```typescript
interface LogEmitterOpts {
  level: Level.Spec;
  context: LogEmitterContext;  // { sid?, reqId?, pkgs[], pkgSep }
  msgSep: Integer;
  transportMgr: TransportMgr;  // Direct reference for emitting
  demark?: (name: string, keep?: boolean) => number;
}
```

---

## Issues and Implementation Tasks

### Resolved Issues (March 2026)

#### 🔴 Critical Bug - FIXED

**1. AbstractTransport.alive always returns false**
- **Location**: `transports/base/transport.ts:265`
- **Fix**: Changed to return `this._bReady && this._bEnabled`
- **Impact**: `TransportMgr.remove()` now correctly filters only dead transports

#### 🟡 Performance Issues - FIXED

**2. emitEnabled/dataEnabled/stackEnabled always return true**
- **Location**: `msg-emitter.ts:92-124`
- **Fix**: All three getters now check `this.#transportMgr.meetsAnyThreshold(this.#level)`
- **Impact**: MsgBuilder skips expensive operations when no transport will accept the message

#### 🟡 Architecture Issues - FIXED

**4. Unused emitCallback in LogEmitterOpts**
- **Location**: `types.ts:122`, `msg-emitter.ts:77`
- **Fix**: Removed the unused `emitCallback` field from interface and constructor

**5. Dual/inconsistent emit paths**
- **Fix**: MsgEmitter now checks thresholds via `meetsAnyThreshold()` through the `emitEnabled` getter
- **Result**: All emit paths now use consistent threshold logic

**7. Remove commented-out code**
- **Files cleaned**: `base/logger.ts`, `interfaces.ts`, `msg-emitter.ts`, `min/logger.ts`
- **Impact**: Cleaner codebase, no dead code

**8. Remove unused fields from LogMgr**
- **Removed**: `_type`, `_msgBuilder`, `_mark`, `_loggerCount`
- **Impact**: Smaller LogMgr footprint

**9. Fix syntax error in base/logger.ts**
- **Fix**: Removed dangling `/**` comment before `emit()` method

---

## Design Decisions to Resolve

### Q1: How should IndentLogger access TransportMgr?

**Status**: ARCHITECTURAL DECISION PENDING - See Design Plan below

**Current approach (through Entry):**
- Entry carries `transports: TransportMgr`
- IndentLogger.emit(entry) calls `entry.transports.meetsAnyThreshold()` and `entry.transports.emit()`
- Pro: Works, decouples IndentLogger from LogMgr
- Con: Every Entry has infrastructure reference; odd for a data structure

**Design Plan for LogMgr/TransportMgr Messaging System**

Given the user's desire for a more message-flow oriented architecture while maintaining backward compatibility, here is a proposed plan:

#### Option A: Event Bus Pattern (RECOMMENDED)

**Concept**: Introduce a lightweight event bus between LogMgr and TransportMgr.

**Implementation**:
```typescript
// New file: src/messaging/bus.ts
interface LogEventBus {
  emit(entry: Entry): void;
  onEmit(handler: (entry: Entry) => void): () => void;  // Returns unsubscribe
}

class SimpleEventBus implements LogEventBus {
  private handlers: Set<(entry: Entry) => void> = new Set();
  
  emit(entry: Entry): void {
    this.handlers.forEach(h => h(entry));
  }
  
  onEmit(handler: (entry: Entry) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
```

**Changes**:
1. `LogMgr` owns the event bus instance
2. `TransportMgr` subscribes to the bus on initialization
3. `MsgEmitter` emits to the bus instead of directly to TransportMgr
4. `Entry` no longer needs `transports` field
5. `IndentLogger` can access the bus via `this._logMgr.eventBus`

**Pros**:
- Pure decoupling - no direct references needed
- Entry becomes pure data
- Easy to add new consumers (metrics, filtering, etc.)
- Backward compatible via adapter pattern

**Cons**:
- Slight performance overhead (function call indirection)
- More complex architecture

**Migration Path**:
1. Add event bus alongside existing direct references
2. Migrate TransportMgr to subscribe to bus
3. Update MsgEmitter to emit to bus
4. Update IndentLogger to use bus via LogMgr
5. Deprecate and remove Entry.transports (major version bump)

#### Option B: Logger Context Pattern

**Concept**: Pass a lightweight context object to IndentLogger that contains only what it needs.

**Implementation**:
```typescript
// In LogMgr
interface ILoggerContext {
  meetsAnyThreshold(level: Level.Spec): boolean;
  emit(entry: Entry): void;
}

// IndentLogger stores reference to context
class IndentLogger<M> extends Base.Logger<M> {
  protected _context: ILoggerContext;
  
  override emit(msg: Log.Entry): void {
    if (this._context.meetsAnyThreshold(msg.level)) {
      this._context.emit(msg);
    }
  }
}
```

**Pros**:
- Entry stays pure data
- Minimal changes to existing architecture
- No global event bus needed

**Cons**:
- Still couples IndentLogger to infrastructure concepts
- Context interface needs to be maintained

#### Option C: Keep Current Approach

**Concept**: Accept that Entry carries a TransportMgr reference as a pragmatic compromise.

**Justification**:
- Current system works reliably
- Entry is internal to the package (not exposed to users)
- The coupling is limited and well-understood
- Performance is optimal (direct reference)

---

## Recommended Next Steps

1. **Short term**: Keep current Entry.transports approach - it's working
2. **Medium term**: If messaging flexibility becomes critical, implement Option A (Event Bus)
3. **Long term**: Consider Option A as part of a v2.0 architecture with breaking changes

---

## Testing Considerations

When making changes:
1. **Test TransportMgr.remove()** — ensure it doesn't remove all transports (bug #1) ✅
2. **Test threshold filtering** — ensure messages below threshold are not formatted (optimization #2) ✅
3. **Test IndentLogger.emit()** — ensure indentation still works with whatever fix is chosen
4. **Test flush behavior** — ensure ERROR+ messages trigger flush
5. **Test child loggers** — ensure context (sid/reqId/pkg) inheritance works

---

## File Priority for Changes

| Priority | File | Reason |
|----------|------|--------|
| 🔴 Critical | `transports/base/transport.ts` | Bug #1 — fix `alive` getter ✅ |
| 🟡 High | `msg-emitter.ts` | Performance #2 — implement emitEnabled ✅ |
| 🟢 Medium | `types.ts` | Architecture #4 — remove emitCallback ✅ |
| 🟢 Medium | `loggers/base/logger.ts` | Cleanup #7, #9 — remove dead code, fix syntax ✅ |
| 🟢 Medium | `loggers/interfaces.ts` | Cleanup #7 — remove ILevels interface ✅ |
| 🟢 Medium | `loggers/min/logger.ts` | Cleanup #7 — remove commented getters ✅ |
| 🟢 Medium | `logmgr.ts` | Cleanup #8 — remove unused fields ✅ |
| 🔵 Low | Future | Architecture #3 — decide on Entry.transports |

---

**Current version**: 0.x.x | **Entry**: `src/mod.ts` | **JSR**: `@epdoc/logger`

**Generated**: 2026-03-08 | **Review Scope**: Full review of packages/logger/src/ per TODO.md requirements

(End of file - updated March 2026)
