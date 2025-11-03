# @epdoc/logger

A comprehensive TypeScript logging library designed for modern server applications and CLI applications where output to the console or other transports is important. It features a pluggable architecture, rich message formatting, and context-aware logging.

## Features

*   **Pluggable Transports:** Output logs to the console, files, or other destinations.
*   **Rich Message Formatting:** Use a fluent API to create structured and colorful log messages.
*   **Context-Aware Logging:** Easily add and track context such as request IDs.
*   **Hierarchical Loggers:** Create child loggers that inherit settings from their parents, for example to handle new HTTP requests.
*   **TypeScript Native:** Built with TypeScript for strong typing.

## Packages

This repository is a monorepo containing the following published and public packages:

*   **[@epdoc/logger](./packages/logger/README.md):** The core logging library.
*   **[@epdoc/msgbuilder](./packages/msgbuilder/README.md):** A powerful message formatting library.
*   **[@epdoc/loglevels](./packages/loglevels/README.md):** Manages log levels and their properties.
*   **[@epdoc/cliapp](./packages/cliapp/README.md):** A library for creating command-line applications with integrated logging.
*   **[examples](./packages/examples/README.md):** A collection of examples demonstrating how to use the logging library.

### In Development

The following packages are in early development and should be ignored:

*   **[@epdoc/logdy](./packages/logdy/README.md):** A transport for the [Logdy](https://logdy.dev/) log management tool.
*   **[@epdoc/logjava](./packages/logjava/README.md):** Supports loglevels as per Java's Log4j.

## Documentation

For detailed documentation, please refer to the following files in the [`./docs`](./docs) directory:

*   **[GETTING_STARTED.md](./docs/GETTING_STARTED.md):** A guide to getting started with the logging library.
*   **[ARCHITECTURE.md](./docs/ARCHITECTURE.md):** An overview of the library's architecture and components.
*   **[CONFIGURATION.md](./docs/CONFIGURATION.md):** Detailed information on configuring the logger.

Each package also contains its own `README.md` file with more specific information.

## Getting Started

To get started, please see the [GETTING_STARTED.md](./docs/GETTING_STARTED.md) guide.

## Development Tooling

Historically, the `@epdoc/launchgen` utility has been used to generate `launch.json` files for debugging within this repository.

## AI Development

This project has used AI for parts of it's development. The [GEMINI.md](./GEMINI.md) file contains project-specific instructions for AI models to follow when working on this project. We also use a more global GEMINI_GLOBAL.md file that is not currently published but that contains the bulk of our AI instructions.

## License

This project is licensed under the [MIT License](./LICENSE).
