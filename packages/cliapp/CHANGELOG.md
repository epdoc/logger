# Changelog

All notable changes to this project will be documented in this file.

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
