import type { BoolStyleOptions } from './types.ts';

// Defined without an explicit top-level type constraint
// so the keys ('default', 'bold', 'bullet') remain literal types.
export const BOOL_PRESETS = {
  check: {
    trueChar: '✓',
    falseChar: '✗',
  } as BoolStyleOptions,
  checkBold: {
    trueChar: '✔',
    falseChar: '✖',
  } as BoolStyleOptions,
  circle: {
    trueChar: '●',
    falseChar: '‧',
  } as BoolStyleOptions,
  yesno: {
    trueChar: 'yes',
    falseChar: 'no',
  } as BoolStyleOptions,
  truefalse: {
    trueChar: 'true',
    falseChar: 'false',
  } as BoolStyleOptions,
};
