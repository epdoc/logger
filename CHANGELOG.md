# Changelog

All notable changes to this project will be documented in this file.

## [1002.2.1] - 2025-07-23

Fix regression. The `StdLogger` and `CliLogger` now correctly implement the `IEmitter` interface.

## [1002.2.0] - 2025-07-23

This release focuses on a major documentation overhaul and significant improvements to the logger's threshold-handling
logic to provide a more intuitive and less error-prone developer experience.

### ✨ New Features

- **Threshold Warnings**: The logger now provides warnings when a user-configured threshold might not behave as
  expected. A warning is logged if a logger's threshold is set to be less restrictive than its parent's (or the
  `LogMgr`'s), as the more restrictive setting will always take precedence.

### ⬆️ Improvements

- **Major Documentation Overhaul**:
  - Created a new `docs/getting-started.md` to provide a comprehensive guide for new users.
  - Created a new `docs/loggers.md` to clearly explain the concept of root and child loggers.
  - Reorganized and rewrote `README.md`, `docs/configuration.md`, and `docs/logmgr.md` to be more concise, better
    structured, and less repetitive.
  - Updated all documentation to use the exported `TimestampFormat` and `OutputFormat` constants instead of string
    literals for clearer and safer code examples.
- **Consistent Logger API**: Added a `threshold` getter and setter to the `Logger` class, making its API consistent with
  the `LogMgr`.
- **Clearer JSDoc**: Improved the JSDoc comments for `setThreshold` in both the logger and log manager to explicitly
  state that the most restrictive threshold (between the logger, manager, and transport) is the one that takes effect.
- **Parent-Child Logger Relationship**: Formally established a parent-child relationship between loggers by adding a
  `parent` property, making the logger hierarchy explicit.

### 🐛 Bug Fixes

- Fixed a recursive type definition (`LogLevelConfigMap...`) that was causing type-checking and tool-related issues.
- Corrected type errors that arose from renaming the `Transport.Format` enum to `Transport.OutputFormat`.
- Resolved type errors that occurred after introducing the `parent` property to the `IInherit` interface.


## [1000.0.0]

A major rewrite that is incompatible with prior versions of this module

- Version prior to version 1000.0.0 (versions 2.x.x) were used in production, and were last updated at the end of 2016.
- Version 1000.0.0 is a TypeScript rewrite using Deno and is not backwards compatible with earlier versions. The main
  points for this new version are:
  - Chainable methods to allow for easy color formatting of log output when using the console
  - Maintains the Log Manager and transports concepts of the earlier version
  - Only a console and file transport have so far been written
  - Express and other middleware are not yet written, but should be easy for any user to create
  - Version 1000.0.0 is reliant on Deno std libraries for console color (I may change this dependency when I package
    this for general use)
  - substitutable log levels (e.g 'info','input','data' instead of 'info', 'verbose', 'debug')
  - customizable through class extension
