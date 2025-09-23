# Log Levels

## Industry Standard Log Levels

This table shows common industry log levels. 

| Meaning of the Log | Standard (Common) | Python (`logging`) | Java (Logback/Log4j) | Java (`java.util.logging`) [java] | npm (Winston) [std] |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Catastrophic Failure** (App cannot continue) | **FATAL** | **CRITICAL** | **FATAL** | **SEVERE** | **ERROR** |
| **Serious Error** (Issue in a routine, but app continues) | **ERROR** | **ERROR** | **ERROR** | **SEVERE** | **ERROR** |
| **Potential Problem** (Unexpected, but non-critical event) | **WARN** | **WARNING** | **WARN** | **WARNING** | **WARN** |
| **Important Information** (High-level app events) | **INFO** | **INFO** | **INFO** | **INFO** | **INFO** |
| **Configuration Info** (Static settings during startup) | - | - | - | **CONFIG** | - |
| **Verbose** (Unique to npm) | - | - | - | - | **VERBOSE** |
| **General Debugging** (Broad diagnostic messages for developers) | **DEBUG** | **DEBUG** | **DEBUG** | **FINE** | **DEBUG** |
| **Ultra-Fine Tracing** (Method entry/exit, detailed flow) | **TRACE** | - | **TRACE** | **FINER** | - |
| **Excessively Verbose** (Extremely granular, non-essential data) | - | - | - | **FINEST** | **SILLY** |

## @epdoc/logger Log Levels

We provide the following log level sets:

| Level | `Log.Bare.Logger` (minimalist) |`Log.Min.Logger` (minimalist) | `Log.Std.Logger` (superset of the Standard, NPM amd log4j) | `Log.Java.Logger` (`java.util.logging`)|
| :--- | :--- | :--- | :--- | :--- |
| **FATAL** | - | - | ✔ **FATAL** \| **CRITICAL** | - |
| **ERROR** | - | ✔ **ERROR** | ✔ **ERROR** | ✔ **SEVERE** |
| **WARN** |  ✔ **WARN** |  ✔ **WARN** | ✔ **WARN** | ✔ **WARN** |
| **INFO** |  ✔ **INFO** |  ✔ **INFO** | ✔ **INFO** | ✔ **INFO** |
| **VERBOSE** |  - |  - | ✔ **VERBOSE** | ✔ **CONFIG** |
| **DEBUG** |  - |  ✔ **DEBUG** | ✔ **DEBUG** | ✔ **FINE** |
| **TRACE** |  - |  - | ✔ **TRACE** | ✔ **FINER** |
| **SPAM** |  - |  - | ✔ **SPAM**  \| **SILLY** | ✔ **FINEST** |


The `Bare` set is meant for library modules that wish to support @epdoc/logger without locking the user into the `Std` or `Java` loggers. The `Min` set would be a step up from using the `Bare` set and would require the main project to use something based on it.

We also provide `Log.Cli.Logger` with levels `error`, `warn`, `help`, `data`, `info`, `debug`,
`prompt`, `verbose`, `input` and `silly`. This set of log levels is not commonly used, and you are
encouraged to not use it.