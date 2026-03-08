# @epdoc/loglevels

This module provides a system for defining and managing custom log levels in a logging framework. It allows you to
create your own log level hierarchy, including names, numeric values, [OTLP](https://opentelemetry.io/) mappings, and
even custom formatting functions. The module is primarily intended to be used with
[@epdoc/logger](https://github.com/epdoc/logger).

## Installation

```sh
deno add @epdoc/loglevels
```

## Usage

The core of this module is the `LogLevels` class, which takes a `LogLevelsSet` definition and provides an interface
for working with your custom levels. We DO NOT declare log levels in this module.

```ts
import { LogLevels, type LogLevelsSet, compareLevels, applyColors } from '@epdoc/loglevels';
import { bold, red, yellow } from '@std/fmt/colors';

// 1. Define your custom log levels using OTLP severity numbers (1–24)
const myLevels: LogLevelsSet = {
  id: 'my-app',
  levels: {
    CRITICAL: { severity: 21, fmtFn: (str) => bold(red(str)) },
    ERROR: { severity: 17, fmtFn: red },
    WARN: { severity: 13, fmtFn: yellow },
    INFO: { severity: 9 },
    DEBUG: { severity: 5 },
  },
};

// 2. Create a level manager instance
const levels = new LogLevels(myLevels);

// 3. Look up levels — asSpec() returns a Spec or null
const infoSpec = levels.asSpec('INFO')!;
console.log(infoSpec.name);       // 'INFO'
console.log(infoSpec.severity);   // 9

// 4. Use well-known levels
console.log(levels.defaultLevel.name);  // 'INFO' (severity 9)
console.log(levels.warnLevel.name);     // 'WARN' (severity 13)
console.log(levels.flushLevel.name);    // 'ERROR' (severity 17)

// 5. Compare levels using Spec objects
const errorSpec = levels.asSpec('ERROR')!;
const debugSpec = levels.asSpec('DEBUG')!;
console.log(compareLevels(errorSpec, debugSpec));  // +1 (ERROR > DEBUG)
console.log(compareLevels(debugSpec, errorSpec));  // -1 (DEBUG < ERROR)

// 6. Apply level-specific colors
console.log(applyColors('This is an error!', errorSpec));  // (red text)

// 7. Threshold check — direct severity comparison
const threshold = levels.asSpec('INFO')!;
const shouldLog = errorSpec.severity >= threshold.severity;  // true
```

### Working with Spec Objects

The primary data type is `Spec`, which bundles a level's name, severity, and
optional formatting into a single object:

```ts
type Spec = {
  name: string;           // e.g. 'INFO', 'ERROR'
  severity: number;       // OTLP severity (1–24)
  fmtFn?: (str: string) => string;  // optional color/style function
  icon?: string;          // optional display icon
};
```

Instead of passing around raw level names or severity numbers, the codebase
passes `Spec` objects. Use `asSpec()` to convert a name or severity into a Spec,
or access well-known levels via `defaultLevel`, `warnLevel`, and `flushLevel`.

### API Overview

- **`LogLevelsSet`**: Configuration object passed to the `LogLevels` constructor. Contains an `id` string and a
  `levels` record mapping level names to `LogLevelsSpec` objects.

- **`LogLevels`**: The main class. Implements `IBasic`. Provides `asSpec()`, `maxWidth()`, and well-known level
  getters (`defaultLevel`, `warnLevel`, `flushLevel`).

- **`IBasic`**: The core interface for log level management. Allows different level sets to be used interchangeably.

- **`compareLevels(a, b)`**: Standalone function comparing two Spec objects by severity. Returns `+1`, `0`, or `-1`.

- **`applyColors(msg, spec)`**: Standalone function that applies a Spec's `fmtFn` to a message string.

- **Type guards**: `isSpec()`, `isSeverityNumber()`, `isLogLevelSpec()`, `isLogLevelMap()`, `isLogLevelsSet()`.

## Industry Standard Log Levels

This table shows common industry log levels.

| Meaning of the Log                                               | Standard (Common) | Python (`logging`) | Java (Logback/Log4j) | Java (`java.util.logging`) [java] | npm (Winston) [std] |
| :--------------------------------------------------------------- | :---------------- | :----------------- | :------------------- | :-------------------------------- | :------------------ |
| **Catastrophic Failure** (App cannot continue)                   | **FATAL**         | **CRITICAL**       | **FATAL**            | **SEVERE**                        | **ERROR**           |
| **Serious Error** (Issue in a routine, but app continues)        | **ERROR**         | **ERROR**          | **ERROR**            | **SEVERE**                        | **ERROR**           |
| **Potential Problem** (Unexpected, but non-critical event)       | **WARN**          | **WARNING**        | **WARN**             | **WARNING**                       | **WARN**            |
| **Important Information** (High-level app events)                | **INFO**          | **INFO**           | **INFO**             | **INFO**                          | **INFO**            |
| **Configuration Info** (Static settings during startup)          | -                 | -                  | -                    | **CONFIG**                        | -                   |
| **Verbose** (Unique to npm)                                      | -                 | -                  | -                    | -                                 | **VERBOSE**         |
| **General Debugging** (Broad diagnostic messages for developers) | **DEBUG**         | **DEBUG**          | **DEBUG**            | **FINE**                          | **DEBUG**           |
| **Ultra-Fine Tracing** (Method entry/exit, detailed flow)        | **TRACE**         | -                  | **TRACE**            | **FINER**                         | -                   |
| **Excessively Verbose** (Extremely granular, non-essential data) | -                 | -                  | -                    | **FINEST**                        | **SILLY**           |

## @epdoc/logger Log Levels

We provide the following log level sets in [@epdoc/logger](../logger/README.md). All sets use the same numeric values for the same levels, and these are based
off of OTLP severity levels.

| Level (OTLP)    | `Log.Bare.Logger` (minimalist) | `Log.Min.Logger` (minimalist) | `Log.Otlp.Logger` (OTLP levels) | `Log.Std.Logger` (superset of the Standard, NPM amd log4j) | `Log.Java.Logger` (`java.util.logging`) |
| :-------------- | :----------------------------- | :---------------------------- | :------------------------------ | :--------------------------------------------------------- | :-------------------------------------- |
| **FATAL2** (22) | -                              | -                             | -                               | ✔ **FATAL**                                                | -                                       |
| **FATAL** (21)  | -                              | -                             | ✔ **FATAL**                     | ✔ **CRITICAL**                                             | -                                       |
| **ERROR** (17)  | -                              | ✔ **ERROR**                   | ✔ **ERROR**                     | ✔ **ERROR**                                                | ✔ **SEVERE**                            |
| **WARN** (13)   | ✔ **WARN**                     | ✔ **WARN**                    | ✔ **WARN**                      | ✔ **WARN**                                                 | ✔ **WARN**                              |
| **INFO** (9)    | ✔ **INFO**                     | ✔ **INFO**                    | ✔ **INFO**                      | ✔ **INFO**                                                 | ✔ **INFO**                              |
| **DEBUG2** (6)  | -                              | -                             | -                               | ✔ **VERBOSE**                                              | -                                       |
| **DEBUG** (5)   | -                              | ✔ **DEBUG**                   | ✔ **DEBUG**                     | ✔ **DEBUG**                                                | ✔ **CONFIG**                            |
| **TRACE4** (4)  | -                              | -                             | -                               | -                                                          | -                                       |
| **TRACE3** (3)  | -                              | -                             | -                               | ✔ **TRACE**                                                | ✔ **FINE**                              |
| **TRACE2** (2)  | -                              | -                             | -                               | ✔ **SPAM**                                                 | ✔ **FINER**                             |
| **TRACE** (1)   | -                              | -                             | ✔ **TRACE**                     | ✔ **SILLY**                                                | ✔ **FINEST**                            |

The `Bare` set is meant for library modules that wish to support @epdoc/logger without locking the user into the `Std`
or `Java` loggers. The `Min` set would be a step up from using the `Bare` set and would require the main project to use
something based on it.

We also provide `Log.Cli.Logger` with levels `error`, `warn`, `help`, `data`, `info`, `debug`, `prompt`, `verbose`,
`input` and `silly`. This set of log levels is less commonly used.

## OTLP Log Severity Levels

| Number | Short Name | Description            |
| ------ | ---------- | ---------------------- |
| **1**  | TRACE      | Trace-level severity   |
| **2**  | TRACE2     |                        |
| **3**  | TRACE3     |                        |
| **4**  | TRACE4     |                        |
| **5**  | DEBUG      | Debug-level severity   |
| **6**  | DEBUG2     |                        |
| **7**  | DEBUG3     |                        |
| **8**  | DEBUG4     |                        |
| **9**  | INFO       | Informational severity |
| **10** | INFO2      |                        |
| **11** | INFO3      |                        |
| **12** | INFO4      |                        |
| **13** | WARN       | Warning severity       |
| **14** | WARN2      |                        |
| **15** | WARN3      |                        |
| **16** | WARN4      |                        |
| **17** | ERROR      | Error severity         |
| **18** | ERROR2     |                        |
| **19** | ERROR3     |                        |
| **20** | ERROR4     |                        |
| **21** | FATAL      | Fatal severity         |
| **22** | FATAL2     |                        |
| **23** | FATAL3     |                        |
| **24** | FATAL4     |                        |

### Commonly Used Subset

In practice, these are the most commonly used levels:

1. **TRACE** (1) - Most verbose, for tracing execution flow
2. **DEBUG** (5) - Debug information for developers
3. **INFO** (9) - General operational information
4. **WARN** (13) - Warning messages (potentially harmful situations)
5. **ERROR** (17) - Error messages (failed operations)
6. **FATAL** (21) - Severe errors causing application failure
