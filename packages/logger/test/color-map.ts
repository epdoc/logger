export const set = {
  // Text attributes
  bold: '\x1b[1m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m', // Swaps foreground and background colors

  // Foreground text colors
  blackText: '\x1b[30m',
  redText: '\x1b[31m', // Standard red, not used in original but good for completeness
  greenText: '\x1b[32m', // Standard green, used by enable.value, enable._package
  yellowText: '\x1b[33m', // Standard yellow, used by enable.h3, enable.warn, enable._reqId, enable._sid
  blueText: '\x1b[34m', // Standard blue, used by enable.label, enable._action
  magentaText: '\x1b[35m', // Standard magenta, used by enable.h1, enable.h2, enable.highlight
  cyanText: '\x1b[36m', // Standard cyan
  whiteText: '\x1b[37m', // Used by enable._plain, enable._suffix, enable._elapsed

  // Bright foreground text colors
  grayText: '\x1b[90m', // Also known as bright black, used by enable.path, enable._level, enable._source
  brightRedText: '\x1b[91m', // Used by enable.error, enable._errorPrefix
  brightGreenText: '\x1b[92m', // Used by enable.value, enable._package (original used this for green)
  brightYellowText: '\x1b[93m', // Used by enable.h3, enable.warn, enable._reqId, enable._sid (original used this for yellow)
  brightBlueText: '\x1b[94m', // Used by enable.label, enable._action (original used this for blue)
  brightMagentaText: '\x1b[95m', // Used by enable.h1, enable.h2, enable.highlight (original used this for magenta)
  brightCyanText: '\x1b[96m', // Used by enable.date
  brightWhiteText: '\x1b[97m', // Used by enable.text

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m', // Standard yellow background
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // Bright background colors
  bgBrightBlack: '\x1b[100m',
  bgBrightRed: '\x1b[101m',
  bgBrightGreen: '\x1b[102m',
  bgBrightYellow: '\x1b[103m', // Used by enable.action
  bgBrightBlue: '\x1b[104m',
  bgBrightMagenta: '\x1b[105m',
  bgBrightCyan: '\x1b[106m',
  bgBrightWhite: '\x1b[107m',
};

export const reset = {
  all: '\x1b[0m', // Resets all attributes
  bold: '\x1b[22m', // Resets bold or dim
  underline: '\x1b[24m', // Resets underline
  inverse: '\x1b[27m', // Resets inverse
  fg: '\x1b[39m', // Resets foreground color to default
  bg: '\x1b[49m', // Resets background color to default
};

export const enable = {
  text: set.brightWhiteText,
  h1: set.bold + set.magentaText, // Original: magenta THEN bold
  h2: set.magentaText, // Original: magenta
  h3: set.yellowText, // Original: yellow
  action: set.blackText + set.bgYellow, // Original: bgYellow THEN black
  label: set.blueText, // Original: blue
  highlight: set.brightMagentaText, // Original: brightMagenta (was magenta code) THEN bold
  value: set.greenText, // Original: green
  path: set.underline + set.grayText, // Original: underline THEN gray
  date: set.brightCyanText,
  warn: set.brightYellowText, // Original: brightYellow (was yellow code) THEN bold
  error: set.bold + set.brightRedText, // Original: brightRed THEN bold (order of codes was bold then red)
  strikethru: set.inverse, // Original: inverse (strikethrough is \x1b[9m, inverse is \x1b[7m) - kept inverse as per original code
  _reqId: set.brightYellowText, // Original: brightYellow (was yellow code)
  _sid: set.underline + set.brightYellowText, // Original: underline THEN yellow
  _package: set.brightGreenText, // Original: green
  _action: set.brightBlueText, // Original: blue
  _plain: set.whiteText,
  _suffix: set.whiteText,
  _elapsed: set.whiteText,
  _level: set.grayText,
  _source: set.grayText,
  _errorPrefix: set.brightRedText,
};

export const disable = {
  text: reset.fg,
  h1: reset.fg + reset.bold, // reset bold THEN reset color
  h2: reset.fg,
  h3: reset.fg,
  action: reset.bg + reset.fg, // reset fg THEN reset bg
  label: reset.fg,
  highlight: reset.fg, // reset bold THEN reset color
  value: reset.fg,
  path: reset.fg + reset.underline, // reset fg THEN reset underline
  date: reset.fg,
  warn: reset.fg, // reset bold THEN reset color
  error: reset.fg + reset.bold, // reset bold THEN reset color (corrected from fg only)
  strikethru: reset.inverse, // reset inverse
  _reqId: reset.fg,
  _sid: reset.fg + reset.underline, // reset fg THEN reset underline
  _package: reset.fg,
  _action: reset.fg,
  _plain: reset.fg,
  _suffix: reset.fg,
  _elapsed: reset.fg,
  _level: reset.fg,
  _source: reset.fg,
  _errorPrefix: reset.fg,
};
