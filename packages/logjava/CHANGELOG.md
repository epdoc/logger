# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1-beta.0] - 2025-10-13

- Updated dependencies

## [0.0.1-alpha.2] - 2025-09-21

### Changed
- Updated package as part of logger ecosystem reorganization
- Improved integration with shared test utilities
- Enhanced documentation and examples

### Fixed
- Validated decomposition architecture works correctly
- Ensured proper dependency direction (logjava depends on logger, not vice versa)

## [0.0.1-alpha.1] - 2025-09-21

### Added
- Initial release of Java logger as separate package
- Complete Java-style logging with industry-standard levels (SEVERE, WARNING, INFO, CONFIG, FINE, FINER, FINEST)
- Comprehensive test suite and documentation
- Proper integration with @epdoc/logger ecosystem

### Changed
- Extracted from main logger package as part of decomposition strategy
