# Refactoring Logger Interfaces

This document outlines the plan and progress for refactoring the logger implementations to reduce code duplication and improve maintainability while preserving static type safety. 

## Status

Implementation has not begun, but was attempted with Gemini, with an explosion of complexity.

## 1. Analysis of the Current Approach

The current implementation uses separate, explicit classes for each logger type (e.g., `StdLogger`, `CliLogger`).

### Pros

*   **Ultimate Type Safety:** The TypeScript compiler and IDE know exactly which methods are available on any given logger instance.
*   **Discoverability:** It is easy for developers to find and understand the capabilities of a specific logger by reading its class definition.
*   **Simplicity of Individual Parts:** Each logger implementation is self-contained and straightforward.

### Cons

*   **Code Duplication (Boilerplate):** The core logic is repeated across multiple logger classes.
*   **High Maintenance Overhead:** Adding or changing a log level requires modifying multiple files. Creating a new logger type is a multi-file effort.
*   **Poor Scalability:** The pattern becomes increasingly cumbersome as more logger variations are added.

## 2. Proposed Architecture: A Dynamic, Type-Generated Approach

The proposed solution is to adopt a DRY (Don't Repeat Yourself) model by using a single, generic `Logger` class and dynamically generating its methods and type definitions from a `LogLevelsDef` object. This leverages TypeScript's advanced type features (mapped types, generics, and conditional types).

### Key Benefits

*   **DRY:** A single `Logger` class eliminates redundant logic.
*   **Single Source of Truth:** The `LogLevelsDef` objects become the sole definition for both runtime behavior and compile-time type safety.
*   **Maintainability:** Adding a new level is a one-line change. Adding a new logger type is as simple as defining a new `LogLevelsDef` object.
*   **Scalable:** This pattern will not create more work for you as the number of logger types grows.
*   **Type-Safe:** Retains full static type safety, the primary advantage of the original approach.

## 3. Implementation Plan

The refactoring process will be executed in the following steps.

*   [ ] **Step 1: Define Core Generic Types.**
    *   Created `LoggerMethods<L extends string>` mapped type in `packages/logger/src/loggers/types.ts`.
    *   Created `LoggerInstance<T extends LogLevelsDef<any>>` intersection type.
    *   Created `ILogger` interface extending `IEmitter`, `ILevels`, `IInherit`, `IIndent`.
    *   Created `IIndent` interface.
    *   Made `LogLevelsDef` generic in `packages/loglevels/src/types.ts`.

*   [ ] **Step 2: Create a Single, Generic `Logger` Class.**
    *   Refactored `AbstractLogger` to `Logger<M extends MsgBuilder.Abstract, L extends string>` in `packages/logger/src/loggers/base/logger.ts`.
    *   Implemented dynamic method generation in the constructor.
    *   Integrated `IndentLogger` logic (properties and methods) into the generic `Logger`.
    *   Updated `packages/logger/src/loggers/base/mod.ts` to export the new `Logger`.

*   [ ] **Step 3: Refactor `LogMgr` to Use the Generic Factory.**
    *   Updated `ILogMgrSettings` in `packages/logger/src/types.ts` to include `logLevels`.
    *   Refactored `LogMgr` in `packages/logger/src/logmgr.ts` to remove `_loggerFactories` and `init()`.
    *   Modified `getLogger()` to accept `LogLevelsDef` and return `LoggerInstance`.
    *   Updated `getMsgBuilder` parameter type.
    *   Cleaned up imports in `logmgr.ts`.

*   [ ] **Step 4: Remove Redundant Logger Implementations.**
    *   Consolidated `LogLevelsDef` constants into `packages/logger/src/loggers/consts.ts`.
    *   Deleted old logger directories (`bare`, `cli`, `indent`, `min`, `std`) from `packages/logger/src/loggers/`.
    *   Updated `packages/logger/src/loggers/mod.ts` to export new constants and generic `Logger` components.
    *   Removed `packages/logger/src/loggers/factory.ts` and `packages/logger/src/loggers/helpers.ts`.

*   [ ] **Step 5: Update All Imports and Usage.**
    *   [ ] Refactored `packages/examples/*.ts` files.
    *   [ ] Refactored `packages/logger/test/*.ts` files.
    *   [ ] Refactored `packages/logdy/test/transport.test.ts`.

