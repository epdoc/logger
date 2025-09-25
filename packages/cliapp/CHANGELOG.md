# Changelog

All notable changes to this project will be documented in this file.

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
