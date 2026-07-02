import { blue, lemon, magenta, sage } from '@epdoc/colors/colors';
import * as colors from '@std/fmt/colors';
import type * as Commander from 'commander';

/**
 * Configuration for the command's help and output formatting.
 * This object defines the styles for various components of the help message, such as titles, commands, and options,
 * using the `colors` module to apply consistent formatting.
 */
export const config: { help: Commander.HelpConfiguration; output: Commander.OutputConfiguration } = {
  help: {
    styleTitle: (str) => blue(str),
    styleCommandText: (str) => magenta(str),
    styleCommandDescription: (str) => colors.white(str),
    styleDescriptionText: (str) => {
      return colors.white(str);
    },
    styleOptionText: (str) => sage(str),
    styleArgumentText: (str) => lemon(str),
    styleSubcommandText: (str) => colors.rgb24(str, 0xff981a),
    optionDescription: (option: Commander.Option) => {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(
          // use stringify to match the display of the default value
          colors.dim('choices: ') +
            option.argChoices.map((choice) =>
              colors.dim(colors.rgb24(typeof choice === 'string' ? choice : JSON.stringify(choice), 0xffb020))
            ).join(', '),
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
            colors.dim('default: ') +
              colors.rgb24(option.defaultValueDescription || JSON.stringify(option.defaultValue), 0xffb020),
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
