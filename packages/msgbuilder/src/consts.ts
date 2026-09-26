import type { LineType } from './types.ts';

/**
 * Maps a named {@link LineType} to its bar glyph.
 *
 * Used by quote indentation to resolve `line: 'thin' | 'medium' | 'thick'` to a
 * concrete character. Override per call with an explicit `char`.
 */
export const LINE_TYPES: Record<LineType, string> = {
  thin: '│',
  medium: '▌',
  thick: '┃',
};
