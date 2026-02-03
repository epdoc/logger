# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-03

- Declare version 0.1.0

## [0.1.0-alpha.8] - 2026-02-03

- Declare version 0.1.0

## [0.1.0-alpha.7] - 2026-01-04

- Deprecate extender() function in favor of direct class extension

## [0.1.0-alpha.6] - 2025-12-31

- Updated dependencies

## [0.1.0-alpha.5] - 2025-12-27

- Housekeeping change

## [0.1.0-alpha.4] - 2025-12-26

- Minor jsdoc improvement

## [0.1.0-alpha.3] - 2025-12-22

- Moved msgbuilder-extension into Console

## [0.1.0-alpha.2] - 2025-12-22

- feat: add extendBuilder helper for easy MsgBuilder customization

- Add extendBuilder() function to simplify extending Console.Builder with custom methods
- Eliminates complex inheritance patterns and factory setup boilerplate
- Maintains full type safety for custom methods
- Add comprehensive BDD-style tests demonstrating functionality
- Update README with extension examples and real-world use cases
- Export helper from main module for easy access

BREAKING CHANGE: None - fully backward compatible addition

## [0.0.13] - 2025-12-16

- Updated dependencies

## [0.0.12] - 2025-12-14

- update dependencies

## [0.0.11] - 2025-12-11

- Updated dependencies

## [0.0.10] - 2025-12-06

- Updated dependencies

## [0.0.9] - 2025-12-06

- Update dependencies

## [0.0.8] - 2025-12-06

- Updated dependencies

## [0.0.7] - 2025-11-28

- Updated dependencies

## [0.0.6] - 2025-11-21

- Update dependencies. Added new methods

## [0.0.5] - 2025-11-21

### Added
- Added `.url()` method for styling URLs with cyan color
- Added `.code()` method for styling inline code/commands with bright white color
- Added `.success()` method for styling success messages with bright green color

### Changed
- Updated default color scheme for better visibility:
  - `text`: Changed from bright white to white
  - `h1`: Changed from bold magenta to bright white
  - `label`: Changed from blue to gray
  - `value`: Changed from green to bright green
  - `path`: Changed from underlined gray to cyan
  - `warn`: Changed from bright yellow to yellow
  - `error`: Changed from bold bright red to red
- Updated test utilities (`color-map.ts`) to match new color scheme
- Fixed `label` test to use color constants instead of hardcoded ANSI codes

### Fixed
- All unit tests now pass with updated color scheme (39 tests)

## [0.0.4] - 2025-11-13

- Update dependencies

## [0.0.3] - 2025-11-07

- updated dependencies

## [0.0.1] - 2025-10-29

- Declare v0.0.1 of msgbuilder

## [0.0.1-alpha.10] - 2025-10-13

- Updated dependencies

## [0.0.1-alpha.9] - 2025-10-06

- update dependencies

## [0.0.1-alpha.8] - 2025-10-05

- Update dependencies

## [0.0.1-alpha.7] - 2025-10-05

- Update @epdoc/type dependency.

## [0.0.1-alpha.6] - 2025-10-05

- Updated dependencies

## [0.0.1-alpha.5] - 2025-09-25

- Modified how elapsed is handled

## [0.0.1-alpha.4] - 2025-09-21

### Changed
- Moved shared test utilities to workspace root (`test-utils/color-map.ts`)
- Updated test imports to use shared color definitions
- Removed duplicate `color-map.ts` file from package

### Fixed
- Consolidated color testing utilities for better maintainability
- Standardized test color definitions across logger ecosystem

## [0.0.1-alpha.3] - Previous Release
- Previous functionality (details not tracked in this changelog)
