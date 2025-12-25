# @epdoc/msgbuilder

> **📚 Complete Documentation**: This package is part of the [@epdoc/logger ecosystem](../../README.md). For comprehensive guides, tutorials, and integration examples, see the [root documentation](../../README.md).

This module provides a fluent, chainable interface for creating structured, stylable log messages.

## Quick Links to Complete Documentation

- **[🚀 Getting Started Guide](../../GETTING_STARTED.md)** - Complete tutorial including custom message builders
- **[🎯 Demo Project](../../packages/demo/)** - Complete CLI app with custom message builder examples
- **[💡 Examples Collection](../../packages/examples/)** - Focused message builder examples
- **[🏗️ Architecture Overview](../../ARCHITECTURE.md)** - Technical architecture and message builder patterns
- **[⚙️ Configuration Guide](../../CONFIGURATION.md)** - Advanced message builder configuration
- **[📝 Core Logger](../../packages/logger/README.md)** - Integration with logging system
- **[💻 CLI Framework](../../packages/cliapp/README.md)** - Use with CLI applications

## Package-Specific Features

This package provides message formatting with:

## Installation

```sh
deno add @epdoc/msgbuilder
```

> **💡 Ecosystem Integration**: This package is designed to work with [@epdoc/logger](../logger/) for logging and [@epdoc/cliapp](../cliapp/) for CLI applications. See the [complete ecosystem guide](../../GETTING_STARTED.md) for integrated usage patterns.

## Usage

This module can be used in two ways:

1.  **Standalone Formatting:** When used without an `IEmitter`, it functions as a general-purpose string builder with styling capabilities.
2.  **Logging:** When associated with a logger `IEmitter`, it builds a log entry that can be emitted to a transport.

### Standalone Usage

The `ConsoleMsgBuilder` can be used to generate formatted strings without a logger.

#### Using `format()`

The `format()` method returns the formatted string, which you can then output or manipulate.

```ts
import { Console } from '@epdoc/msgbuilder';

const builder = new Console.Builder();
const formattedString = builder.h1('Standalone').value(123).format();
// formattedString is "Standalone 123"
console.log(formattedString);
```

#### Using `emit()`

For direct output, the `emit()` method formats the message and logs it to the console in a single step. It does this because the `Console.Builder` uses a `ConsoleEmitter` when no emitter is passed to it's constructor.

```ts
import { Console } from '@epdoc/msgbuilder';

new Console.Builder()
  .h1('Hello from msgbuilder!')
  .text('This is a standalone message.')
  .emit();
// This will output a styled message directly to the console.
```

### Logging Example

```ts
import { Log } from '@epdoc/logger';

const log = new Log.Mgr().getLogger();
log.info.h1('Hello').text('World').emit();
```

### Conditional Logging

Our default `MsgBuilder` supports conditional logging, which allows you to build and emit log messages only when certain conditions are met. This is useful for reducing logging verbosity and focusing on specific scenarios.

The conditional logging methods are:

-   `if(condition: boolean)`: Starts a conditional block. The following methods will only be executed if the `condition` is `true`.
-   `elif(condition: boolean)`: Starts an "else if" block. The following methods will only be executed if the previous `if` or `elif` conditions were `false` and this `condition` is `true`.
-   `else()`: Starts an "else" block. The following methods will only beexecuted if all previous `if` and `elif` conditions were `false`.
-   `endif()`: Ends a conditional block.

Here's an example of how to use conditional logging:

```typescript
const someCondition = true;
const anotherCondition = false;

log.info
  .if(someCondition)
    .text('This will be logged because someCondition is true.')
  .elif(anotherCondition)
    .text('This will NOT be logged.')
  .else()
    .text('This will NOT be logged either.')
  .endif()
  .emit();
```

## Performance Timing

The message builder supports emit with time (EWT) functionality for performance measurement when used with a logger.

### Creating Performance Marks

Use the logger's `mark()` method to create a performance mark:

```ts
const log = new Log.Mgr().getLogger();
const mark = log.mark(); // Returns a unique mark identifier
```

### Using `ewt()` - Emit With Time

The message builder's `ewt()` method calculates elapsed time since a mark was created and includes it in the log output:

```ts
const log = new Log.Mgr().getLogger();

// Basic usage
const mark1 = log.mark();
// ... some operation ...
log.info.h1('Operation completed').ewt(mark1);
// Output: "Operation completed (123 ms)"

// Keep mark for reuse
const mark2 = log.mark();
// ... first operation ...
log.info.h1('First checkpoint').ewt(mark2, true); // keep=true preserves the mark
// ... second operation ...
log.info.h1('Final result').ewt(mark2); // Measures total time from original mark
```

### Time Formatting

The elapsed time is automatically formatted with appropriate precision:
- **> 100ms**: No decimal places (e.g., "123 ms")
- **10-100ms**: 1 decimal place (e.g., "45.6 ms") 
- **1-10ms**: 2 decimal places (e.g., "7.89 ms")
- **< 1ms**: 3 decimal places (e.g., "0.123 ms")

### Example Usage

```ts
import { Log } from '@epdoc/logger';

const log = new Log.Mgr().init().getLogger();

// Measure database operation
const dbMark = log.mark();
await database.query('SELECT * FROM users');
log.info.h1('Database query').ewt(dbMark);

// Measure multiple checkpoints
const processMark = log.mark();
await step1();
log.debug.h1('Step 1 completed').ewt(processMark, true);
await step2();
log.debug.h1('Step 2 completed').ewt(processMark, true);
await step3();
log.info.h1('Process completed').ewt(processMark);
```

## Extending MsgBuilder

You can easily extend the MsgBuilder Console with custom methods using the `extender()` helper. This eliminates the complexity of manual inheritance and factory setup.

### Basic Extension

```ts
import { Console } from '@epdoc/msgbuilder';

const MyBuilder = Console.extender({
  apiCall(method: string, endpoint: string) {
    return this.label(method).text(' ').text(endpoint);
  },
  
  metric(name: string, value: number, unit?: string) {
    return this.text(name).text(': ').text(value.toString()).text(unit ? ` ${unit}` : '');
  }
});

// Use with logger
const logMgr = new Log.Mgr();
logMgr.msgBuilderFactory = (emitter) => new MyBuilder(emitter);
const log = logMgr.getLogger();

log.info.apiCall('GET', '/api/users').emit();
log.info.metric('Response Time', 245, 'ms').emit();
```

### Real-World Examples

```ts
// For API logging
const ApiBuilder = Console.extender({
  request(method: string, url: string, status?: number) {
    let builder = this.text(method).text(' ').text(url);
    if (status) {
      const color = status < 400 ? 'success' : 'error';
      builder = builder.text(` (${status})`);
    }
    return builder;
  },
  
  timing(duration: number) {
    return this.text('[').text(`${duration}ms`).text(']');
  }
});

// For file operations
const FileBuilder = Console.extender({
  fileOp(operation: string, path: string, size?: number) {
    let builder = this.action(operation).text(' ').path(path);
    if (size) {
      const kb = Math.round(size / 1024);
      builder = builder.text(` (${kb}KB)`);
    }
    return builder;
  }
});

// Usage
log.info.request('POST', '/api/data', 201).text(' ').timing(156).emit();
log.info.fileOp('copied', '/path/to/file.txt', 2048).emit();
```

### Type Safety

The extended builder maintains full type safety for your custom methods:

```ts
const TypedBuilder = Console.extender({
  status(level: 'success' | 'warning' | 'error', message: string) {
    return this.text(`[${level.toUpperCase()}]`).text(` ${message}`);
  }
});

// TypeScript will enforce the correct parameter types
log.info.status('success', 'Operation completed').emit();
// log.info.status('invalid', 'test').emit(); // TypeScript error
```

## API

### `AbstractMsgBuilder`

The foundational message builder for creating structured, stylable log messages.

This abstract class provides a fluent, chainable interface for constructing log messages piece by piece. It serves two primary purposes:

1.  **Logging:** When associated with a logger `IEmitter`, it builds a log entry that can be emitted to a transport.
2.  **Standalone Formatting:** When used without an `IEmitter`, it functions as a general-purpose string builder with styling capabilities.

It manages message parts, indentation, conditional logic, and structured data, and implements the `IFormatter` interface for final string conversion.

### `ConsoleMsgBuilder`

A message builder for creating styled console messages.

This class extends `AbstractMsgBuilder` to provide a fluent interface for building complex, styled log messages. It supports various formatting options, including headers, labels, values, and error messages.

We've shown you above how you can call `Console.extender` to extend the `ConsoleMsgBuilder` with even more methods.

### `IEmitter`

Defines the interface for an emitter, which is responsible for outputting log messages.

### `ConsoleEmitter`

An `IEmitter` implementation that outputs formatted log messages to the console.

### `TestEmitter`

An `IEmitter` implementation designed for testing purposes.

This emitter captures the formatted output in a public `output` property instead of writing to a destination, allowing for easy inspection in tests.
