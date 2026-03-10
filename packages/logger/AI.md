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
   - Emits directly to TransportMgr
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
| `LogMgr` | `logmgr.ts` | Central manager. Owns TransportMgr. Creates loggers. Provides threshold default. Routes Entry objects to TransportMgr. |
| `MsgEmitter` | `msg-emitter.ts` | Per-call lightweight emitter. Created by LogMgr for each message. Captures logger context (sid, reqId, pkgs). Implements IEmitter interface for MsgBuilder. Emits Entry directly to TransportMgr. Provides `progressEnabled` flag for progress mode detection. |
| `TransportMgr` | `transports/mgr.ts` | Owns transport collection. Manages queue when transports not ready. Distributes Entry to all transports. Computes flush flag. Provides meetsAnyThreshold() and hasProgressCapableTransport() for optimization. |
| `AbstractTransport` | `transports/base/transport.ts` | Base for all transports. Has threshold, show opts, emitFilter(). Actual output in subclasses. |
| `AbstractLogger` | `loggers/base/logger.ts` | Base logger. No threshold (removed). Manages context (sid, reqId, pkgs). Has mark()/demark() for EWT. |
| `IndentLogger` | `loggers/indent/logger.ts` | Adds indent/outdent/nodent. Overrides emit() to apply indentation. Emits via TransportMgr. |
| `StdLogger` / `CliLogger` / etc. | `loggers/*/` | Add level-specific getters (info, warn, error, etc.). |
| `Entry` | `types.ts` | Pure data structure passed through the system. Contains level, timestamp, msg (formatter), context. No infrastructure references. |

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
  progressEnabled?: boolean;   // True if this level supports progress mode
  demark?: (name: string, keep?: boolean) => number;
}
```

---

## Progress Support

### Overview

The logger provides infrastructure for progress indicators (spinners, progress bars) in interactive terminal environments.

### How Progress Mode Works

**When is progress mode enabled?**
1. The log level exactly matches the LogMgr threshold
2. There's at least one `ConsoleTransport` with:
   - `progress: true` option
   - Running in an interactive TTY (`isTTY: true`)
   - NOT in MCP mode (`useStderr: false`)

**Three Operating Modes:**

| Mode | Condition | Behavior |
|------|-----------|----------|
| **SUPPRESSED** | Level < threshold | No output |
| **PROGRESS** | Level == threshold + TTY + progress enabled | Show spinner/progress bar |
| **EMIT** | Level > threshold OR no TTY | Emit normal log messages |

### Usage in Custom MsgBuilder

```typescript
class ProgressMsgBuilder extends Console.Builder {
  start(): void {
    if (!this._emitter.emitEnabled) {
      return;  // SUPPRESSED mode
    }
    
    if (this._emitter.progressEnabled) {
      // PROGRESS mode: Show spinner
      this.#progressLine.start(this.format());
    } else {
      // EMIT mode: Normal log
      this.emit();
    }
  }
  
  update(progress: number): void {
    if (this._emitter.progressEnabled) {
      this.#progressLine.update(progress);
    } else if (this._emitter.emitEnabled) {
      this.value(progress).emit();
    }
  }
  
  stop(): void {
    if (this._emitter.progressEnabled) {
      this.#progressLine.stop();
    }
  }
}
```

### ConsoleTransport Configuration

```typescript
// Normal mode - no progress
const normalConsole = new ConsoleTransport(logMgr, {
  format: 'text',
  color: true
});

// Progress mode - interactive terminal
const progressConsole = new ConsoleTransport(logMgr, {
  format: 'text',
  progress: true  // Enable progress support
});

// MCP mode - stderr only, no progress
const mcpConsole = new ConsoleTransport(logMgr, {
  format: 'text',
  useStderr: true  // Disables progress automatically
});

// Force non-TTY mode
const nonInteractiveConsole = new ConsoleTransport(logMgr, {
  format: 'text',
  isTTY: false  // Override auto-detection
});
```

### Implementation Notes

- Progress output always goes to **stderr** (even when `useStderr: false` for normal logs)
- Only **ConsoleTransport** supports progress mode
- File and InfluxDB transports always receive normal log entries
- Progress mode is determined at **MsgEmitter** creation time based on current threshold

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

## Design Decisions - RESOLVED

### Q1: How should IndentLogger access TransportMgr?

**Status**: ✅ RESOLVED - Implemented Simplified Architecture

**Solution Implemented: Direct Reference with Clear Ownership**

LogMgr owns TransportMgr directly, and MsgEmitter holds a direct reference for emission:

**Architecture**:
```
LogMgr (owns TransportMgr, creates loggers)
    ↓
MsgEmitter (holds TransportMgr reference, captures context)
    ↓
TransportMgr (manages transports, checks thresholds)
    ↓
Transports (output to console/file/etc.)
```

**Key Design Points**:
1. **LogMgr** owns `TransportMgr` directly (created in constructor)
2. **MsgEmitter** receives `TransportMgr` reference at construction time
3. **MsgEmitter** checks `transportMgr.meetsAnyThreshold()` for optimization
4. **Entry** is pure data - no infrastructure references
5. **IndentLogger** emits via `this._logMgr.transportMgr.emit()`

**Threshold Management**:
- `TransportMgr.meetsAnyThreshold(level)` checks if any transport accepts the level
- `MsgEmitter` uses this to skip expensive operations (data serialization, stack traces)
- Each transport has its own threshold, checked during `transport.emit()`

**Initialization Pattern** (Simple):
```typescript
const logMgr = new Log.Mgr();
const logger = await logMgr.getLogger();
logger.info.text('Hello World').emit();
```

**Custom Transport Setup**:
```typescript
const logMgr = new Log.Mgr();

// Add custom transports
await logMgr.addTransport(new FileTransport(logMgr, { filepath: 'app.log' }));
await logMgr.addTransport(new InfluxTransport(logMgr, { database: 'logs' }));

const logger = await logMgr.getLogger();
```

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
| 🟡 High | `transports/mgr.ts` | Architecture — meetsAnyThreshold() ✅ |
| 🟡 High | `logmgr.ts` | Architecture — own TransportMgr ✅ |
| 🟢 Medium | `types.ts` | Architecture — remove emitCallback ✅ |
| 🟢 Medium | `loggers/base/logger.ts` | Cleanup #7, #9 — remove dead code, fix syntax ✅ |
| 🟢 Medium | `loggers/interfaces.ts` | Cleanup #7 — remove ILevels interface ✅ |
| 🟢 Medium | `loggers/min/logger.ts` | Cleanup #7 — remove commented getters ✅ |
| 🟢 Medium | `loggers/indent/logger.ts` | Architecture — use transportMgr for emit ✅ |
| 🟢 Medium | `AI.md` | Documentation — update architecture docs ✅ |

---

**Current version**: 0.x.x | **Entry**: `src/mod.ts` | **JSR**: `@epdoc/logger`

**Generated**: 2026-03-08 | **Review Scope**: Full review of packages/logger/src/ per TODO.md requirements

(End of file - updated March 2026)
