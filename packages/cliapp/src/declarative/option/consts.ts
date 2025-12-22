import { ArrayOption } from './array.ts';
import { BooleanOption } from './boolean.ts';
import { DateOption } from './date.ts';
import { NumberOption } from './number.ts';
import { PathOption } from './path.ts';
import { StringOption } from './string.ts';

/**
 * Option definition helpers
 */
export const option = {
  string: (flags: string, description: string): StringOption => new StringOption(flags, description),
  number: (flags: string, description: string): NumberOption => new NumberOption(flags, description),
  boolean: (flags: string, description: string): BooleanOption => new BooleanOption(flags, description),
  date: (flags: string, description: string): DateOption => new DateOption(flags, description),
  path: (flags: string, description: string): PathOption => new PathOption(flags, description),
  array: (flags: string, description: string): ArrayOption => new ArrayOption(flags, description),
};
