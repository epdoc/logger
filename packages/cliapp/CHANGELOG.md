# Changelog

All notable changes to this project will be documented in this file.

## [1.1.3] - 2025-12-27

- Added show.color option

## [1.1.2] - 2025-12-26

- Changed Fluent Options "done" to "emit"

## [1.1.1] - 2025-12-26

- COMMIT_MSG

## [1.1.0] - 2025-12-25

- Declare release

## [1.1.0-alpha.13] - 2025-12-25

- updated dependencies

## [1.1.0-alpha.12] - 2025-12-25

- updated dependencies

## [1.1.0-alpha.11] - 2025-12-25

- Improve ContextBundle documentation and fix addLogging type constraints

- Move ContextBundle type to dedicated types.ts with comprehensive documentation
- Fix addLogging() to work with custom message builders by relaxing type constraints
- Add automatic argument flattening in base command class for variadic arguments
- Remove unused imports and fix all lint errors
- Enhance structured command API with better type safety

## [1.1.0-alpha.10] - 2025-12-25

- fixes to get demo running

## [1.1.0-alpha.9] - 2025-12-25

- API evolution, removing declarative, adding base cmd syntax

## [1.1.0-alpha.8] - 2025-12-23

- Updated documentation and jsdoc

## [1.1.0-alpha.7] - 2025-12-22

- added argument parsing support

## [1.1.0-alpha.6] - 2025-12-22

- Changes to protected methods in BaseContext

## [1.1.0-alpha.5] - 2025-12-22

- Fixed option export

## [1.1.0-alpha.4] - 2025-12-22

- Fixed option export

## [1.1.0-alpha.3] - 2025-12-22

- feat: add inverted boolean support and extensible option system

- Add inverted() method to BooleanOption for --no- style flags
- BaseOption class designed for subclassing custom option types
- Support for custom parsers like @epdoc/daterange integration

## [1.1.0-alpha.2] - 2025-12-22

- feat: update dependencies to latest logger and msgbuilder versions

- Update @epdoc/logger to 1003.1.0-alpha.2 (includes createLogManager helper)
- Update @epdoc/msgbuilder to 0.1.0-alpha.3 (includes Console.extender)
- Maintain existing declarative API functionality
- Ready for ecosystem integration with new helpers

## [Unreleased]

### Added
- **Declarative Command API**: New simplified API for defining CLI commands with minimal boilerplate
  - `defineCommand()` and `defineRootCommand()` factory functions
  - `option` helpers for common option types (string, number, boolean, date, path, array)
  - Automatic type inference for command options
  - `createApp()` utility for single-line app creation
  - Support for single-command, multi-command, and hybrid app patterns
  - Automatic option ordering (app options first, logging options last)
  - Full backward compatibility with existing imperative API

### Changed
- Updated README with declarative API examples and migration guide
- Added comprehensive examples in `../examples/declarative.ts`

## [1.0.12] - 2025-12-16

- Updated dependencies

## [1.0.11] - 2025-12-14

- update dependencies

## [1.0.10] - 2025-12-11

- Updated dependencies

## [1.0.9] - 2025-12-06

- Updated dependencies

## [1.0.8] - 2025-12-06

- Update dependencies

## [1.0.7] - 2025-12-06

- Updated dependencies

## [1.0.6] - 2025-11-28

- Updated dependencies

## [1.0.5] - 2025-11-25

- Added author and license to DenoPkg type

## [1.0.4] - 2025-11-21

- Updated dependencies

## [1.0.3] - 2025-11-13

- Update dependencies

## [1.0.2] - 2025-11-07

- Updated dependencies

## [1.0.0] - 2025-10-29

- Declare v1.0.0 of cliapp

## [1.0.0-beta.2] - 2025-10-20

- Updated dependencies

## [1.0.0-beta.1] - 2025-10-17

- Update logger dependency

## [1.0.0-beta.0] - 2025-10-13

- Updated dependencies

## [1.0.0-alpha.9] - 2025-10-06

- update dependencies

## [1.0.0-alpha.8] - 2025-10-05

- Update dependencies

## [1.0.0-alpha.7] - 2025-10-05

- Update @epdoc/* dependencies.

## [1.0.0-alpha.5] - 2025-10-05

- Updated dependencies
- Fix issues with conflicting elapsed for timestamp and elapsed, so renamed elapsed to `time`.

## [1.0.0-alpha.4] - 2025-10-05

- Updated dependencies

## [1.0.0-alpha.3] - 2025-09-25

- Added elapsed field to CliApp

## [1.0.0-alpha.2] - 2025-09-25

- Ported to new `@epdoc/logger@1003.0.0-alpha.4`
- CliApp has not changed, however @epdoc/logger has undergone a major update.

## [0.10.3] - 2025-09-25

- Integrate into @epdoc/logger repo with unit tests passing

## [0.10.2] - 2025-09-19

- Added `workspace` to `DenoPkg`. Updated to latest Deno v2.5.1 requirements.

## [0.9.0] - 2025-08-09

- Modify `Command` constructor to take a `DenoPkg` rather than a context.

## [0.8.1] - 2025-08-07

- Override `Help.optionDescription` to allow custom formatting of choices and default.

## [0.8.0] - 2025-08-06

- Updated to use[@epdoc/logger](https://jsr.io/@epdoc/logger) v1002.4.0

## [0.6.1] - 2025-08-03

- Updated to use[@epdoc/logger](https://jsr.io/@epdoc/logger) v1002.3.2

## [0.6.0] - 2025-07-28

- Updated to use[@epdoc/logger](https://jsr.io/@epdoc/logger) v1002.3.0

## [0.5.0] - 2025-07-22

### Added

- Exported the `Commander` object from the main module, allowing users to create custom `Commander.Option` instances and
  other objects.
- Added comprehensive JSDoc comments to all files in the `src` directory to improve code clarity and maintainability.

### Changed

- Updated the `README.md` with a new example and clearer instructions that reflect the `Commander` export.
- Incremented the minor version number to `0.5.0` to reflect the new feature addition.
