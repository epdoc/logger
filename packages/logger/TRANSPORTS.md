# Transports

Transports are responsible for outputting log messages to various destinations. The logger supports multiple transport types that can be used individually or combined.

## Available Transports

### Console Transport

Outputs log messages to the console with color formatting and customizable output options.

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const logMgr = Log.createLogManager(Console.Builder, {
  transports: [new Log.Transport.Console.Transport()],
  threshold: 'info'
});
```

**Features:**
- Color-coded output based on log level
- Customizable formatting options
- Support for different output streams (stdout/stderr)
- ANSI color support detection

### File Transport

Writes log messages to files with support for rotation, buffering, and different file modes.

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const fileTransport = new Log.Transport.File.Transport({
  filename: 'app.log',
  bufferSize: 4096,
  mode: 'append'
});

const logMgr = Log.createLogManager(Console.Builder, {
  transports: [fileTransport],
  threshold: 'info'
});
```

**Features:**
- File rotation support
- Configurable buffer sizes
- Multiple file modes (append, overwrite)
- Automatic directory creation
- Graceful error handling

### Buffer Transport

Captures log messages in memory for testing and programmatic inspection.

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const bufferTransport = new Log.Transport.Buffer.BufferTransport({
  maxEntries: 1000
});

const logMgr = Log.createLogManager(Console.Builder, {
  transports: [bufferTransport],
  threshold: 'info'
});

// Later in tests
const logger = logMgr.getLogger();
logger.info.text('Test message').emit();

// Inspect captured logs
const entries = bufferTransport.getEntries();
bufferTransport.assertContains('Test message');
```

**Features:**
- In-memory log capture
- Configurable entry limits with FIFO behavior
- Rich inspection API
- Built-in assertion methods for testing
- Level-based filtering
- Pattern matching support

**Testing Methods:**
- `getEntries()` - Get all captured entries
- `getEntriesByLevel(level)` - Filter by log level
- `contains(text)` - Check if any message contains text
- `matches(pattern)` - Check if any message matches regex
- `assertContains(text)` - Assert message contains text
- `assertCount(n)` - Assert exact number of entries
- `assertMatches(pattern)` - Assert message matches pattern
- `clear()` - Clear all captured entries

## Using Multiple Transports

You can combine multiple transports to output logs to different destinations:

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const consoleTransport = new Log.Transport.Console.Transport();
const fileTransport = new Log.Transport.File.Transport({ filename: 'app.log' });
const bufferTransport = new Log.Transport.Buffer.BufferTransport();

const logMgr = Log.createLogManager(Console.Builder, {
  transports: [consoleTransport, fileTransport, bufferTransport],
  threshold: 'info'
});
```

## Transport Configuration

Each transport can be configured with specific options:

### Console Transport Options

```typescript
interface IConsoleTransportOptions {
  /** Output stream (stdout/stderr) */
  stream?: 'stdout' | 'stderr';
  /** Enable/disable colors */
  colors?: boolean;
  /** Custom color scheme */
  colorScheme?: Record<string, string>;
}
```

### File Transport Options

```typescript
interface IFileTransportOptions {
  /** Output filename */
  filename: string;
  /** File mode */
  mode?: 'append' | 'overwrite';
  /** Buffer size in bytes */
  bufferSize?: number;
  /** Enable file rotation */
  rotate?: boolean;
  /** Maximum file size before rotation */
  maxSize?: number;
}
```

### Buffer Transport Options

```typescript
interface IBufferTransportOptions {
  /** Maximum number of entries to store */
  maxEntries?: number;
}
```

## Creating Custom Transports

You can create custom transports by extending the `BaseTransport` class:

```typescript
import { BaseTransport } from '@epdoc/logger';

class CustomTransport extends BaseTransport {
  protected async _write(message: string, data?: unknown): Promise<void> {
    // Your custom output logic here
    console.log(`[CUSTOM] ${message}`);
  }

  protected async _flush(): Promise<void> {
    // Flush any buffered data
  }

  protected async _close(): Promise<void> {
    // Cleanup resources
  }
}
```

## Best Practices

### For Development
- Use `Console.Transport` for immediate feedback
- Add `Buffer.Transport` for testing scenarios
- Set appropriate log levels to avoid noise

### For Production
- Use `File.Transport` for persistent logging
- Configure file rotation to manage disk space
- Consider multiple transports for different log levels

### For Testing
- Use `Buffer.Transport` exclusively in tests
- Clear buffer between test cases
- Use assertion methods for reliable test verification

```typescript
// Example test setup
const bufferTransport = new Log.Transport.Buffer.BufferTransport();
const logMgr = Log.createLogManager(Console.Builder, {
  transports: [bufferTransport],
  threshold: 'debug'
});

// In test
beforeEach(() => {
  bufferTransport.clear();
});

// Test assertions
bufferTransport.assertContains('Expected message');
bufferTransport.assertCount(2);
```
