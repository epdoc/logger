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

The core of this module is the `LogLevels` class, which takes a log level definition object and provides an interface
for working with your custom levels. We DO NOT declare log levels in this module.

```ts
import { LogLevels, type LogLevelsDef } from '@epdoc/loglevels';
import { bold, red, yellow } from '@std/fmt/colors';

// 1. Define your custom log levels
const myLevels: LogLevelsDef = {
  CRITICAL: { val: 0, fmtFn: (str) => bold(red(str)), flush: true },
  ERROR: { val: 1, fmtFn: red },
  WARN: { val: 2, fmtFn: yellow, warn: true },
  INFO: { val: 3, default: true },
  DEBUG: { val: 4, lowest: true },
};

// 2. Create a level manager instance
const levels = new LogLevels(myLevels);

// 3. Use the manager to work with your levels
console.log('All level names:', levels.names);
// Output: All level names: [ 'CRITICAL', 'ERROR', 'WARN', 'INFO', 'DEBUG' ]

console.log('Default level:', levels.defaultLevelName);
// Output: Default level: INFO

const currentThreshold = 'INFO';

console.log(`Should we log a DEBUG message?`, levels.meetsThreshold('DEBUG', currentThreshold));
// Output: Should we log a DEBUG message? false

console.log(`Should we log a WARN message?`, levels.meetsThreshold('WARN', currentThreshold));
// Output: Should we log a WARN message? true

// Apply custom formatting
const errorMessage = 'This is an error!';
console.log(levels.applyColors(errorMessage, 'ERROR'));
// Output: (red text) This is an error!
```

## API Overview

- **`LogLevelsSet`**: A type definition for an object that defines your custom log levels. The keys of the levels
  property are the level names (e.g., `'ERROR'`), and the values are `LogLevelSpec` objects specifying the `val`
  (numeric value) and other properties.

- **`LogLevels`**: A class that takes a `LogLevelsSet` and implements the `IBasic` interface. It provides methods for
  converting between level names and values, checking logging thresholds (`meetsThreshold`), and applying custom
  formatting.

- **`IBasic`**: The core interface that defines the contract for a log level management system. This allows for
  different implementations to be used interchangeably within a logger.

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
