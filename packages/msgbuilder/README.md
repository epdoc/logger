# @epdoc/msgbuilder

This module provides a fluent, chainable interface for creating structured, stylable log messages.

## Installation

```sh
deno add @epdoc/msgbuilder
```

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

### `IEmitter`

Defines the interface for an emitter, which is responsible for outputting log messages.

### `ConsoleEmitter`

An `IEmitter` implementation that outputs formatted log messages to the console.

### `TestEmitter`

An `IEmitter` implementation designed for testing purposes.

This emitter captures the formatted output in a public `output` property instead of writing to a destination, allowing for easy inspection in tests.
