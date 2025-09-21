# @epdoc/logger Workspace Changelog

All notable changes to the @epdoc/logger workspace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025-09-21] - Logger Ecosystem Decomposition & Logdy Integration

### Added
- **New Package**: `@epdoc/logdy` - Logdy transport for real-time log streaming
- **New Package**: `@epdoc/logjava` - Java-style logger extracted from main package
- **Shared Test Utilities**: Centralized color-map definitions in `test-utils/`
- **Comprehensive Test Suite**: New `levels1.test.ts` validating all logger types
- **Architecture Validation**: Proven decomposition strategy with working transport

### Changed
- **Package Versions**: Bumped all packages to latest versions
- **Test Organization**: Consolidated duplicate test utilities across packages
- **Documentation**: Enhanced changelogs and package documentation
- **Architecture**: Validated modular transport system with Logdy integration

### Fixed
- **Test Issues**: Corrected `applyColors` parameter order and case sensitivity
- **Color Testing**: Standardized color expectations across all logger types
- **Import Paths**: Updated all packages to use shared test utilities

### Removed
- **Duplicate Files**: Eliminated redundant `color-map.ts` files across packages
- **Java Logger**: Moved from main package to separate `@epdoc/logjava` package

### Package Versions Updated
- `@epdoc/logger`: 1002.4.7-alpha.0 → 1002.4.8-alpha.0
- `@epdoc/logdy`: 1002.4.7-alpha.0 → 1002.4.8-alpha.0 (new package)
- `@epdoc/logjava`: 0.0.1-alpha.1 → 0.0.1-alpha.2
- `@epdoc/loglevels`: 0.0.1-alpha.3 → 0.0.1-alpha.4
- `@epdoc/msgbuilder`: 0.0.1-alpha.3 → 0.0.1-alpha.4
- `@epdoc/examples`: 0.0.1-alpha.0 → 0.0.1-alpha.1

### Architecture Achievements
- ✅ **Decomposition Strategy Validated**: Successfully extracted Java logger and created Logdy transport
- ✅ **Transport Extensibility Proven**: Logdy transport demonstrates clean integration patterns
- ✅ **Dependency Management**: Proper dependency direction maintained across packages
- ✅ **Test Consolidation**: Shared utilities improve maintainability
- ✅ **Real-world Integration**: Functional Logdy support for production logging
