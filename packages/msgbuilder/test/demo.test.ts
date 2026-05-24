/**
 * Style Demo Test
 *
 * This test outputs a 2D table demonstrating all available ConsoleMsgBuilder styles
 * and icons across all three themes. Rows are style/icon methods, columns are themes.
 *
 * Dynamically discovers:
 * - All ConsoleStyleMap keys
 * - All icon methods (methods starting with 'i', excluding 'indent')
 */

// deno-fmt-ignore
import { Console } from '../src/mod.ts';
// deno-fmt-ignore
import { consoleStyleFormatters, consoleStyleFormattersV0, consoleStyleFormattersV1 } from '../src/console/const.ts';
// deno-fmt-ignore
import type { ConsoleStyleKey } from '../src/console/types.ts';

// Sample text to format with each style
const SAMPLE_TEXT = 'The quick BROWN fox';
const ICON_TEXT = 'Download complete';

// Theme definitions
const THEMES = [
  { name: 'Default', styles: consoleStyleFormatters },
  { name: 'V0', styles: consoleStyleFormattersV0 },
  { name: 'V1', styles: consoleStyleFormattersV1 },
];

/**
 * Gets all ConsoleStyleMap keys dynamically from the default style formatters.
 */
function getStyleKeys(): ConsoleStyleKey[] {
  return Object.keys(consoleStyleFormatters) as ConsoleStyleKey[];
}

/**
 * Gets all icon method names from ConsoleMsgBuilder prototype.
 * Includes methods starting with 'i' but excludes non-icon methods like 'indent'.
 */
function getIconMethods(): string[] {
  const prototype = Console.Builder.prototype;
  const allMethods = Object.getOwnPropertyNames(prototype);

  return allMethods.filter((name) => {
    // Must start with 'i'
    if (!name.startsWith('i')) return false;
    // Exclude non-icon methods
    if (name === 'indent') return false;
    // Must be a method (function)
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    return descriptor && typeof descriptor.value === 'function';
  });
}

/**
 * Formats the sample text using a style method with a specific theme.
 */
function formatStyleWithTheme(styleKey: string, themeStyles: typeof consoleStyleFormatters, colored: boolean): string {
  const originalStyles = Console.Builder.styleFormatters;
  Console.Builder.styleFormatters = themeStyles;

  const builder = new Console.Builder();
  const method = (builder as unknown as Record<string, (...args: unknown[]) => Console.Builder>)[styleKey];

  let result: string;
  if (typeof method === 'function') {
    method.call(builder, SAMPLE_TEXT);
    result = builder.format({ color: colored });
  } else {
    result = 'N/A';
  }

  Console.Builder.styleFormatters = originalStyles;
  return result;
}

/**
 * Formats an icon using the icon method with a specific theme.
 */
function formatIconWithTheme(iconMethod: string, themeStyles: typeof consoleStyleFormatters, colored: boolean): string {
  const originalStyles = Console.Builder.styleFormatters;
  Console.Builder.styleFormatters = themeStyles;

  const builder = new Console.Builder();
  const method = (builder as unknown as Record<string, (...args: unknown[]) => Console.Builder>)[iconMethod];

  if (typeof method === 'function') {
    // Call icon method with appropriate args
    if (iconMethod === 'ibool') {
      method.call(builder, true);
    } else if (iconMethod === 'icon') {
      method.call(builder, '★');
    } else {
      method.call(builder);
    }
    builder.text(ICON_TEXT);
  }

  const result = builder.format({ color: colored });
  Console.Builder.styleFormatters = originalStyles;
  return result;
}

/**
 * Formats text using the plain method with a specific theme.
 */
function formatPlainWithTheme(themeStyles: typeof consoleStyleFormatters, colored: boolean): string {
  const originalStyles = Console.Builder.styleFormatters;
  Console.Builder.styleFormatters = themeStyles;

  const builder = new Console.Builder();
  builder.plain(SAMPLE_TEXT);
  const result = builder.format({ color: colored });

  Console.Builder.styleFormatters = originalStyles;
  return result;
}

/**
 * Calculates the display width of a string, accounting for ANSI escape codes.
 * Matches CSI sequences (ESC [ ... m) which control colors and styles.
 */
function displayWidth(str: string): number {
  // deno-lint-ignore no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/gu, '').length;
}

/**
 * Pads a string to a target display width, accounting for ANSI codes.
 */
function padDisplay(str: string, targetWidth: number): string {
  const width = displayWidth(str);
  const padding = Math.max(0, targetWidth - width);
  return str + ' '.repeat(padding);
}

Deno.test('ConsoleMsgBuilder Style Demo', async (t) => {
  await t.step('should display all styles in a 2D comparison table', () => {
    console.log('\n' + '='.repeat(100));
    console.log('ConsoleMsgBuilder Style Reference Demo');
    console.log('='.repeat(100));

    const styleKeys = getStyleKeys();
    const iconMethods = getIconMethods();

    // Column widths
    const methodColWidth = 15;
    const themeColWidth = 30;

    // Header
    console.log('-'.repeat(100));
    let header = padDisplay('Method', methodColWidth);
    for (const theme of THEMES) {
      header += ' | ' + padDisplay(theme.name, themeColWidth);
    }
    console.log(header);
    console.log('-'.repeat(100));

    // Plain method (from AbstractMsgBuilder)
    let plainRow = padDisplay('plain', methodColWidth);
    for (const theme of THEMES) {
      const formatted = formatPlainWithTheme(theme.styles, true);
      plainRow += ' | ' + padDisplay(formatted, themeColWidth);
    }
    console.log(plainRow);

    // Style methods
    for (const key of styleKeys) {
      let row = padDisplay(key, methodColWidth);
      for (const theme of THEMES) {
        const formatted = formatStyleWithTheme(key, theme.styles, true);
        row += ' | ' + padDisplay(formatted, themeColWidth);
      }
      console.log(row);
    }

    // Icon methods section
    // console.log('-'.repeat(100));
    // let iconHeader = padDisplay('Method', methodColWidth);
    // for (const theme of THEMES) {
    //   iconHeader += ' | ' + padDisplay(theme.name, themeColWidth);
    // }
    // console.log(iconHeader);
    console.log('-'.repeat(100));

    for (const method of iconMethods) {
      let row = padDisplay(method, methodColWidth);
      for (const theme of THEMES) {
        const formatted = formatIconWithTheme(method, theme.styles, true);
        row += ' | ' + padDisplay(formatted, themeColWidth);
      }
      console.log(row);
    }

    console.log('='.repeat(100) + '\n');
  });

  await t.step('should display no-color comparison table (skipped)', () => {
    // This test is skipped in the original - keeping as placeholder
    console.log('\n' + '='.repeat(100));
    console.log('Style Reference (no colors - raw output):');
    console.log('='.repeat(100));

    const styleKeys = getStyleKeys();
    const iconMethods = getIconMethods();

    const methodColWidth = 15;
    const themeColWidth = 15;

    // Header
    console.log('\n' + 'Style Methods:');
    console.log('-'.repeat(70));
    let header = padDisplay('Method', methodColWidth);
    for (const theme of THEMES) {
      header += ' | ' + padDisplay(theme.name, themeColWidth);
    }
    console.log(header);
    console.log('-'.repeat(70));

    // Plain method
    let plainRow = padDisplay('plain', methodColWidth);
    for (const theme of THEMES) {
      const formatted = formatPlainWithTheme(theme.styles, false);
      plainRow += ' | ' + padDisplay(formatted, themeColWidth);
    }
    console.log(plainRow);

    // Style methods
    for (const key of styleKeys) {
      let row = padDisplay(key, methodColWidth);
      for (const theme of THEMES) {
        const formatted = formatStyleWithTheme(key, theme.styles, false);
        row += ' | ' + padDisplay(formatted, themeColWidth);
      }
      console.log(row);
    }

    // Icon methods
    console.log('\n' + 'Icon Methods:');
    console.log('-'.repeat(70));
    let iconHeader = padDisplay('Method', methodColWidth);
    for (const theme of THEMES) {
      iconHeader += ' | ' + padDisplay(theme.name, themeColWidth);
    }
    console.log(iconHeader);
    console.log('-'.repeat(70));

    for (const method of iconMethods) {
      let row = padDisplay(method, methodColWidth);
      for (const theme of THEMES) {
        const formatted = formatIconWithTheme(method, theme.styles, false);
        row += ' | ' + padDisplay(formatted, themeColWidth);
      }
      console.log(row);
    }

    console.log('='.repeat(100) + '\n');
  });
});
