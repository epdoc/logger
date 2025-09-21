# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1-alpha.0] - 2025-09-21

### Added
- Initial release of Logdy transport for @epdoc/logger ecosystem
- Real-time log streaming to Logdy web interface via HTTP API
- Comprehensive batching system with configurable batch size and flush intervals
- Retry logic with exponential backoff for failed requests
- Graceful error handling with re-queuing on failures
- Level mapping from all logger types (CLI, STD, MIN, Java) to Logdy severity levels
- Authentication support with optional API keys
- Extensive configuration options (URL, timeouts, retries, headers)
- Complete test suite validating transport functionality
- Comprehensive documentation with usage examples

### Features
- **HTTP API Integration**: Sends logs to Logdy using standard REST API
- **Batching**: Configurable batch size (default 50) with automatic flushing
- **Retry Logic**: Up to 3 retry attempts with exponential backoff
- **Error Handling**: Graceful degradation with log re-queuing
- **Level Mapping**: Maps all logger levels to Logdy severity (error, warn, info, debug)
- **Context Preservation**: Maintains session IDs, request IDs, and package context
- **Performance**: Non-blocking async processing with bounded queues
- **Reliability**: Timeout handling and resource cleanup

### Architecture Validation
- Successfully validates decomposition strategy for logger ecosystem
- Demonstrates clean dependency patterns (transport depends on core logger interfaces)
- Proves extensibility model for adding new transports
- Confirms modular architecture allows independent transport packages

### Added
- Initial release of Logdy transport for @epdoc/logger ecosystem
- Real-time log streaming to Logdy web interface via HTTP API
- Comprehensive batching system with configurable batch size and flush intervals
- Retry logic with exponential backoff for failed requests
- Graceful error handling with re-queuing on failures
- Level mapping from all logger types (CLI, STD, MIN, Java) to Logdy severity levels
- Authentication support with optional API keys
- Extensive configuration options (URL, timeouts, retries, headers)
- Complete test suite validating transport functionality
- Comprehensive documentation with usage examples

### Features
- **HTTP API Integration**: Sends logs to Logdy using standard REST API
- **Batching**: Configurable batch size (default 50) with automatic flushing
- **Retry Logic**: Up to 3 retry attempts with exponential backoff
- **Error Handling**: Graceful degradation with log re-queuing
- **Level Mapping**: Maps all logger levels to Logdy severity (error, warn, info, debug)
- **Context Preservation**: Maintains session IDs, request IDs, and package context
- **Performance**: Non-blocking async processing with bounded queues
- **Reliability**: Timeout handling and resource cleanup

### Architecture Validation
- Successfully validates decomposition strategy for logger ecosystem
- Demonstrates clean dependency patterns (transport depends on core logger interfaces)
- Proves extensibility model for adding new transports
- Confirms modular architecture allows independent transport packages
