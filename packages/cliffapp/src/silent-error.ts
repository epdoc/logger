import type { ISilentError } from './types.ts';

/**
 * Error class for failures that should not display stack traces.
 */
export class SilentError extends Error implements ISilentError {
  silent = true;
  constructor(message: string) {
    super(message);
  }
}
