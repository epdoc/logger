# ProgressLine Threshold Feature History

## Background (Original Problem)

**Date**: 2026-05-23

Originally, progress mode only activated when the log level exactly matched the threshold. This caused issues when using progress indicators with verbose logging details.

### Original Behavior

```typescript
// At verbose threshold:
this.info.text('Initializing Git Repo').ellipsis().start();
// 'info' level has severity 9
// 'verbose' threshold has severity 10
// They don't match → progressEnabled = false → falls back to emit mode
```

This resulted in:
- With `--log-level verbose`: Info-level `start()` emits regular logs (no progress)
- With `--log-level info`: Info-level `start()` shows progress spinner

### The Problem

When a user wanted to show a progress bar at the info level but also emit verbose details between start and stop, the progress indicator wouldn't work at verbose thresholds because the level didn't exactly match.

## Solution Implementation

**Date**: 2026-05-23 to 2026-05-24

### Changes Made

#### 1. `packages/cliapp/src/progress/types.ts`

Added `level` property to `StartOptions`:

```typescript
export type ProgressThreshold = { 
  level: Level.Name | Level.Severity | Level.Spec 
};

export type StartOptions = ProgressThreshold & Progress.LineOptions;
```

#### 2. `packages/cliapp/src/progress/builder.ts`

Modified `start()` method to accept and process the `level` option:

```typescript
start(options?: StartOptions): this {
  // ...
  let startSeverity = 6; // verbose (default)
  if (options && options.level) {
    const spec = logMgr.logLevels.asSpec(options.level);
    assert(spec, `Invalid threshold ${options.level}`);
    startSeverity = spec.severity;
  }
  const meetsThreshold = startSeverity >= logMgr.threshold.severity;
  
  if (emitter.progressEnabled && meetsThreshold) {
    // Use progress mode
  } else {
    // Fall back to emit mode
  }
}
```

**Key behavior**:
- Default `level` is `'verbose'` (severity 6)
- Progress activates when `levelSeverity >= threshold.severity`
- Falls back to emit mode when the constraint isn't met

### OTLP Severity Reference

| Level | Severity | Description |
|-------|----------|-------------|
| TRACE | 1 | Most verbose |
| DEBUG | 5 | Debug information |
| VERBOSE | 6 | Verbose details |
| INFO | 9 | General information |
| WARN | 13 | Warning messages |
| ERROR | 17 | Error messages |
| FATAL | 21 | Critical failures |

Higher severity numbers = more severe/important.

## Test Coverage

**Date**: 2026-05-24

Created comprehensive test suite in `packages/cliapp/test/progress-start-level.test.ts`:

### Test Suites

1. **Basic behavior** - Level constraint activation
2. **Severity comparison** - Threshold boundary testing
3. **Update and complete** - Fallback behavior
4. **Mixed level workflow** - Info progress with verbose details
5. **Indent interaction** - Suppression during progress
6. **Nested progress** - Multiple level constraints
7. **Error handling** - Invalid level strings
8. **Using pattern** - Automatic cleanup
9. **Edge cases** - Boundary conditions
10. **Practical use cases** - Real-world scenarios

### Example Usage Patterns

```typescript
// Default behavior (level: 'verbose')
log.info.text('Processing').start();

// Constrain to info level - progress only at info+
log.info.text('Building project').start({ level: 'info' });
log.verbose.text('  Compiling TypeScript...').emit();  // Won't disrupt progress
log.verbose.text('  Bundling assets...').emit();
log.info.text('Build complete!').stop();

// At verbose threshold with level: 'info':
// - Progress bar displays at info level
// - Verbose messages emit normally (below threshold, suppressed at info)
// - Clean separation between progress and details
```

## Documentation Updates

**Date**: 2026-05-24

Updated `packages/cliapp/AI.md` to document the `level` option:

```markdown
// Level constraints - control when progress vs emit mode is used
// Use { level: 'xxx' } to specify the minimum log level at which progress activates
// Default is 'verbose' - progress only shows at verbose or more detailed thresholds
this.log.info.text('Building project').start({ level: 'info' });  // Progress at info+
this.log.verbose.text('  Compiling TypeScript...').emit();        // Detail logs
this.log.verbose.text('  Bundling assets...').emit();
this.log.info.text('Build complete!').stop();                     // Complete progress

// Severity comparison (OTLP-based): higher numbers = more severe
// TRACE(1) < DEBUG(5) < INFO(9) < WARN(13) < ERROR(17) < FATAL(21)
// When threshold is info(9): info+ messages show, verbose(6) and debug(5) are suppressed
```

## Indent/Outdent Protection

The existing protection in `packages/logger/src/loggers/indent/logger.ts` remains in place:

- `indent()` - Automatically suppressed when progress is active
- `outdent()` - Automatically suppressed when progress is active
- `nodent()` - No check (intentional - user explicitly wants to reset)

## Files Modified

1. `packages/cliapp/src/progress/types.ts` - Added `level` to `StartOptions`
2. `packages/cliapp/src/progress/builder.ts` - Implemented level checking
3. `packages/cliapp/AI.md` - Updated documentation
4. `packages/cliapp/test/progress-start-level.test.ts` - New test file (created)

## Bug Fix: 2026-05-24

### Problem
When using `{ level: 'info' }` in `start()`, the progress would start correctly but `complete()` and `update()` wouldn't work properly because they checked `emitter.progressEnabled` which is based on the logger's level, not the level option provided to `start()`.

### Example of the Bug
```typescript
// At verbose threshold (severity 6)
log.info.text('Task').start({ level: 'info' });  // Progress started (uses progressCapable)
// ... do work ...
log.info.text('Done').complete();  // Would emit instead of complete progress
// Because: progressEnabled = (INFO(9) === VERBOSE(6)) = false
```

### Fix
Removed the `emitter.progressEnabled` check from `complete()` and `update()`. These methods now only check `activeProgress?.isActive`:

```typescript
// Before:
if (emitter.progressEnabled && activeProgress?.isActive) {
  // Complete/update progress
}

// After:
if (activeProgress?.isActive) {
  // Complete/update progress
}
```

This makes sense because if progress was started (activeProgress is active), it should be completed/updated regardless of the emitter's level settings.

### Files Modified in Bug Fix
1. `packages/cliapp/src/progress/builder.ts` - Removed `emitter.progressEnabled` checks from `complete()` and `update()`

## Future Considerations

- Should `update()` also accept a `level` option for consistency?
- Should there be validation when nesting progress with incompatible level constraints?
- Should the default level be the current log level instead of 'verbose'?
- Should `stop()` have different semantics than `complete()`? Currently they're aliases.

## Related Tests

All existing progress tests continue to pass:
- `progress-level.test.ts` - Automatic progress mode
- `progress-indent.test.ts` - Indent/outdent suppression
- `progress-modes.test.ts` - SUPPRESSED/PROGRESS/EMIT modes
- `progress-nested.test.ts` - Nested progress functionality
- `progress-start-level.test.ts` - New: Level constraint feature
