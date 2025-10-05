# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
