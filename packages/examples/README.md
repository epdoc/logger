# @epdoc/logger Examples

This package contains examples demonstrating various features of the @epdoc/logger ecosystem.

## Examples

### Basic Examples
- **`simple.ts`** - Basic logger usage
- **`cli.ts`** - CLI logger with colored output
- **`threshold.ts`** - Log level thresholds and filtering

### Advanced Examples
- **`mgr-by-settings.ts`** - Logger manager configuration
- **`app-by-settings.ts`** - Application-level logging setup
- **`extend-mgr.ts`** - Extending logger manager functionality
- **`settings-mgr.ts`** - Settings-based configuration

### Transport Examples
- **`logdy.ts`** - Logdy transport for real-time log streaming

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

The `logdy.ts` example demonstrates real-time log streaming to Logdy web interface.

### Prerequisites
1. Install Logdy: `npm install -g @logdy/core`
2. Start Logdy in socket mode: `logdy socket 8081`
3. Open web interface: http://localhost:8080

### Features Demonstrated
- ✅ Real-time log streaming via HTTP API
- ✅ Batching and automatic flushing
- ✅ Different logger types (CLI, STD, MIN)
- ✅ Structured logging with context
- ✅ Error handling and retry logic
- ✅ Graceful shutdown

### Usage
```bash
# Start Logdy in socket mode (in separate terminal)
logdy socket 8081

# Run the example
deno run -A logdy.ts
```

The example will stream logs to Logdy in real-time. Open http://localhost:8080 to see the logs in the web interface.
