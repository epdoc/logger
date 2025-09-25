# @epdoc/logger Examples

This package contains examples demonstrating various features of the @epdoc/logger ecosystem.

## Examples

### Basic Examples
- [simple.ts](./simple.ts) - Basic logger usage
- [cli.ts](./cli.ts) - CLI logger with colored output
- [threshold.ts](./threshold.ts) - Log level thresholds and filtering

### Advanced Examples
- [mgr-by-settings.ts](./mgr-by-settings.ts) - Logger manager configuration
- [app-by-settings.ts](./app-by-settings.ts) - Application-level logging setup
- [extend-mgr.ts](./extend-mgr.ts) - Extending logger manager functionality
- [settings-mgr.ts](./settings-mgr.ts) - Settings-based configuration
- [wrapper.ts](./wrapper.ts) - Wrapper pattern to hide generic complexity

### CliApp Examples

- [Basic CliApp example](./cliapp-basic.ts)
- [CliApp Example with arguments](./cliapp-context.ts)

Try this command for fun:

```bash
[~/dev/@epdoc/logger/packages/examples]> ./cliapp-context.ts -SA --log_show level:-11,sid,reqId,pkg --sid Session2343 --reqId ReqId01 --pkg 'pkg01' --purge --choose bb
0.032s [       INFO] pkg01 Session2343 ReqId01 Running Purge: true Choose: bb Log threshold: SPAM ReqId: ReqId01 SID: Session2343 pkg: pkg01
0.061s [      FATAL] pkg01 Session2343 ReqId01 Fatal message
0.062s [   CRITICAL] pkg01 Session2343 ReqId01 Critical message
0.063s [      ERROR] pkg01 Session2343 ReqId01 Error message
0.064s [       WARN] pkg01 Session2343 ReqId01 Warn message
0.068s [       INFO] pkg01 Session2343 ReqId01 Info message
0.073s [    VERBOSE] pkg01 Session2343 ReqId01 Verbose message
0.074s [      DEBUG] pkg01 Session2343 ReqId01 Debug message
0.074s [      TRACE] pkg01 Session2343 ReqId01 Trace message
0.076s [       SPAM] pkg01 Session2343 ReqId01 Spam message
0.086s [      SILLY] pkg01 Session2343 ReqId01 Silly message
0.099s [       INFO] pkg01 Session2343 ReqId01 Application done```
```

### Transport Examples
- [logdy.ts](./logdy.ts) - Logdy transport for real-time log streaming

## Running Examples

### Run All Examples
```bash
deno task examples
# or
./run.sh
```

### Run Individual Examples
```bash
deno run -A simple.ts
deno run -A logdy.ts
```

## Logdy Transport Example

The [logdy.ts](./logdy.ts) example demonstrates real-time log streaming to Logdy web interface.

### Prerequisites
1. Install Logdy: `npm install -g @logdy/core`
2. Start Logdy in socket mode: `logdy socket 8081 --api-key your-api-key-here`
3. Update `LOGDY_API_KEY` constant in [logdy.ts](./logdy.ts) with your API key
4. Open web interface: http://localhost:8080

### Features Demonstrated
- ✅ Real-time log streaming via HTTP API
- ✅ Batching and automatic flushing
- ✅ Different logger types (CLI, STD, MIN)
- ✅ Structured logging with context
- ✅ Error handling and retry logic
- ✅ Graceful shutdown

### Usage
```bash
# Start Logdy in socket mode with API key (in separate terminal)
logdy socket 8081 --api-key your-api-key-here

# Update LOGDY_API_KEY in logdy.ts, then run the example
deno run -A logdy.ts
```

The example will stream logs to Logdy in real-time. Open http://localhost:8080 to see the logs in the web interface.
