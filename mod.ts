/**
 * The `Log` module serves as the top-level namespace for the entire logging
 * system.
 *
 * @remarks
 * It exports all the core components required for logging, including the
 * {@link Log.Mgr} for management, various logger implementations, and transport
 * mechanisms. This centralized export structure simplifies imports and provides a
 * single entry point to access the library's functionalities.
 *
 * @module
 */
export * as Log from './src/index.ts';
