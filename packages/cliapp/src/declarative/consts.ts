import * as Option from './option/mod.ts';

/**
 * Option definition helpers
 */
export const option = {
  string: (flags: string, description: string): Option.String => new Option.String(flags, description),
  number: (flags: string, description: string): Option.Number => new Option.Number(flags, description),
  boolean: (flags: string, description: string): Option.Boolean => new Option.Boolean(flags, description),
  date: (flags: string, description: string): Option.Date => new Option.Date(flags, description),
  path: (flags: string, description: string): Option.Path => new Option.Path(flags, description),
  array: (flags: string, description: string): Option.Array => new Option.Array(flags, description),
};
