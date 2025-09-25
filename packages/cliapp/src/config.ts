import * as colors from '@std/fmt/colors';
import type * as Commander from 'commander';

/**
 * Configuration for the command's help and output formatting.
 * This object defines the styles for various components of the help message, such as titles, commands, and options,
 * using the `colors` module to apply consistent formatting.
 */
export const config: { help: Commander.HelpConfiguration; output: Commander.OutputConfiguration } = {
  help: {
    styleTitle: (str) => colors.brightBlue(str),
    styleCommandText: (str) => colors.magenta(str),
    styleCommandDescription: (str) => colors.white(str),
    styleDescriptionText: (str) => {
      return colors.white(str);
    },
    styleOptionText: (str) => colors.green(str),
    styleArgumentText: (str) => colors.yellow(str),
    styleSubcommandText: (str) => colors.gray(str),
    optionDescription: (option: Commander.Option) => {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(
          // use stringify to match the display of the default value
          `choices: ${
            option.argChoices.map((choice) =>
              colors.green(typeof choice === 'string' ? choice : JSON.stringify(choice))
            ).join(', ')
          }`,
        );
      }
      if (option.defaultValue !== undefined) {
        // default for boolean and negated more for programmer than end user,
        // but show true/false for boolean option as may be for hand-rolled env or config processing.
        const showDefault = option.required ||
          option.optional ||
          (option.isBoolean() && typeof option.defaultValue === 'boolean');
        if (showDefault) {
          extraInfo.push(
            `default: ${colors.green(option.defaultValueDescription || JSON.stringify(option.defaultValue))}`,
          );
        }
      }
      // preset for boolean and negated are more for programmer than end user
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${colors.green(JSON.stringify(option.presetArg))}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(', ')})`;
        if (option.description) {
          return `${option.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return option.description;
    },
  },

  output: {
    getOutHasColors: () => true,
    getErrHasColors: () => false,
  },
};
