# @epdoc/logjava

Java-style logger implementation for the `@epdoc/logger` ecosystem, providing standard Java log levels and formatting.

## Features

- **Java Log Levels**: Standard Java logging levels (SEVERE, WARNING, INFO, CONFIG, FINE, FINER, FINEST)
- **Type Safety**: Full TypeScript support with proper type definitions
- **Integration**: Seamless integration with `@epdoc/logger` and `@epdoc/msgbuilder`
- **Performance**: Optimized for high-performance logging scenarios

## Installation

```bash
deno add @epdoc/logjava
```

## Usage

### Basic Usage

```ts
import { Log } from '@epdoc/logger';
import { Java } from '@epdoc/logjava';

// Configure LogMgr to use Java logger
const logMgr = new Log.Mgr();
logMgr.loggerFactory = Java.factoryMethods;

// Get a Java logger instance
const logger = logMgr.getLogger<Java.Logger>();

// Use Java log levels
logger.severe.h1('Critical error occurred').emit();
logger.warning.h2('Warning message').emit();
logger.info.text('Information message').emit();
logger.config.text('Configuration loaded').emit();
logger.fine.text('Fine-grained info').emit();
logger.finer.text('Finer details').emit();
logger.finest.text('Finest trace info').emit();
```

### Advanced Configuration

```ts
import { Log } from '@epdoc/logger';
import { Java } from '@epdoc/logjava';

const logMgr = new Log.Mgr();
logMgr.loggerFactory = Java.factoryMethods;
logMgr.threshold = 'INFO'; // Use Java level names

const logger = logMgr.getLogger<Java.Logger>();
logger.info.h1('Application started').emit();
```

## Log Levels

The Java logger provides the following log levels in order of severity:

| Level | Value | Description |
|-------|-------|-------------|
| SEVERE | 0 | Serious failures |
| WARNING | 1 | Potential problems |
| INFO | 2 | Informational messages |
| CONFIG | 3 | Configuration messages |
| FINE | 4 | Tracing information |
| FINER | 5 | Fairly detailed tracing |
| FINEST | 6 | Highly detailed tracing |

## Integration with @epdoc/logger

This package is designed to work seamlessly with the `@epdoc/logger` ecosystem:

- Uses `@epdoc/loglevels` for level management
- Compatible with `@epdoc/msgbuilder` for message formatting
- Supports all standard logger features (transports, thresholds, etc.)

## License

MIT - see LICENSE file for details.
