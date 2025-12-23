/**
 * @file Context module exports
 * @description Provides context management functionality for CLI applications,
 * including the BaseContext pattern for simplified context creation.
 * @module
 */

// BaseContext pattern (recommended approach)
export { BaseContext as Base } from './base.ts';

// Context type definitions
export * from './types.ts';
