# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1003.1.2] - 2025-12-27

- Updated to latest msgbuilder

## [1003.1.1] - 2025-12-27

- Added show.color option

## [1003.1.0] - 2025-12-25

- Declare release

## [1003.1.0-alpha.4] - 2025-12-25

- updated dependencies

## [1003.1.0-alpha.3] - 2025-12-25

- Add BufferTransport for testing and programmatic log inspection

- Create BufferTransport class extending Base.Transport for in-memory log capture
- Add comprehensive testing utilities (assertContains, assertCount, assertMatches)
- Support configurable maxEntries with FIFO behavior for memory management
- Include rich inspection API (getEntries, getMessages, contains, matches)
- Add unit tests covering all BufferTransport functionality
- Update TRANSPORTS.md documentation with BufferTransport usage examples
- Update README.md to mention buffer transport in features list

## [1003.1.0-alpha.2] - 2025-12-22

- feat: add createLogManager helper for simplified logger setup

- Add createLogManager helper function to eliminate complex factory setup boilerplate
- Provides clean options interface for threshold, showLevel, showTimestamp, showData
- Works seamlessly with extendBuilder from @epdoc/msgbuilder for custom methods
- Reduces CLI setup code by ~70% while maintaining full type safety
- Add comprehensive BDD-style test suite demonstrating all functionality
- Update README with helper documentation and migration examples
- Maintains full backward compatibility with existing logger functionality

## [1003.0.11] - 2025-12-16

- Updated dependencies

## [1003.0.10] - 2025-12-14

- update dependencies

## [1003.0.9] - 2025-12-11

- Updated dependencies

## [1003.0.8] - 2025-12-06

- Updated dependencies

## [1003.0.7] - 2025-12-06

- Update dependencies

## [1003.0.6] - 2025-12-06

- Updated dependencies

## [1003.0.5] - 2025-11-28

- Updated dependencies

## [1003.0.4] - 2025-11-21

- Updated dependencies;


## [1003.0.3] - 2025-11-13

- Update dependencies and fix transport for not outputting response time

## [1003.0.2] - 2025-11-07

- update dependencies

## [1003.0.0] - 2025-10-29

- Declare v1003.0.0 of logger

## [1003.0.0-beta.2] - 2025-10-17

- Fixed lint errors in unit tests. Formatted files

## [1003.0.0-beta.1] - 2025-10-17

- Fixed indent support

## [1003.0.0-beta.1] - 2025-10-17

### Added
- Fixed indentation functionality for hierarchical logging
- Revised `IndentLogger` class with `indent()`, `outdent()`, `nodent()`, and `getdent()` methods
- Support for multiple indentation types: numeric (spaces), string, and array-based
- Indentation unit tests
- Child logger indentation inheritance with independent state management

### Changed
- **BREAKING**: Refactored logger architecture to use clean method overrides instead of scattered indentation logic
- Updated all logger subclasses (`BareLogger`, `MinLogger`, `StdLogger`, `CliLogger`) to use `getIndentedMsgBuilder()` for consistent indentation application
- Improved separation of concerns by centralizing indentation logic in `IndentLogger` class
- Enhanced message flow to apply indentation at message builder creation time for better performance

### Fixed
- Indentation now properly applies to all logging paths (both message builder flow and direct emit calls)
- Resolved scattered indentation logic across multiple classes (`Emitter`, `LogMgr`, `AbstractLogger`)

### Technical Details
- Indentation applied by joining array elements with spaces (single space becomes double space as intended)
- Two code paths handle indentation: normal message builder flow via `getIndentedMsgBuilder()` and direct `emit()` calls
- Clean architecture eliminates type casting and improves maintainability
- All level methods (`info`, `debug`, `error`, etc.) now consistently apply indentation

## [1003.0.0-beta.0] - 2025-10-13

- Updated dependencies

## [1003.0.0-alpha.8] - 2025-10-05

- Changed show.elapsed to show.time because of conflicting elapsed and time.

## [1003.0.0-alpha.7] - 2025-09-27

- Fixed bug causing elapsed (mark) time to show up even when zero.

## [1003.0.0-alpha.6] - 2025-09-25

- Fixed elapsed to screen for numbers, not Integers

## [1003.0.0-alpha.5] - 2025-09-25

- Fixes to Console Transport display of parameters.
- Moved mark/demark elapsed time display to transport so it can be put into a column

## [1003.0.0-alpha.4] - 2025-09-25

- Fix lint errors

## [1003.0.0-alpha.3] - 2025-09-25

- Modified how elapsed is handled

## [1002.4.8-alpha.1] - 2025-09-24

- Logger now working and passing all tests with workspaces

## [1002.4.8-alpha.0] - 2025-09-21

### Added
- New comprehensive test suite `levels1.test.ts` for all logger types (CLI, STD, MIN)
- Proper color testing using shared color-map utilities
- Validation of `applyColors` method across all logger implementations

### Changed
- Updated test imports to use shared color definitions from workspace root
- Improved test coverage for log level functionality and color application
- Enhanced test documentation with proper parameter usage examples

### Fixed
- Corrected `applyColors` test parameter order (message first, then level)
- Fixed case sensitivity issues in level name testing (uppercase vs lowercase)
- Resolved color expectation mismatches for STD and MIN debug levels
- Standardized test utilities across logger ecosystem

### Removed
- Java logger implementation (moved to separate `@epdoc/logjava` package)

## [1002.4.7-alpha.0] - Previous Release
- Previous functionality (details not tracked in this changelog)
