import * as CliApp from '@epdoc/cliapp';

/**
 * Custom message builder demonstrating extension of the base builder.
 *
 * Adds application-specific formatting methods for consistent logging.
 */
export class CustomMsgBuilder extends CliApp.Ctx.MsgBuilder {
  /**
   * Format application context parameters for logging.
   *
   * @param ctx - The application context
   * @returns This builder for chaining
   */
  params(ctx: AppContext): this {
    return this.label('debugMode').value(ctx.debugMode ? 'true' : 'false')
      .label('name').value(ctx.name ?? 'none');
  }
}

type CustomLogger = CliApp.Ctx.Logger;

/**
 * Application context with custom message builder support.
 *
 * Extends AbstractBase from cliapp to inherit all standard context functionality
 * including logging setup, dry-run support, and package information.
 */
export class AppContext extends CliApp.Ctx.AbstractBase<CustomMsgBuilder, CustomLogger> {
  isApp = true;
  name?: string;
  debugMode = false;

  protected override builderClass = CustomMsgBuilder;
}

/**
 * Child context demonstrating context inheritance.
 */
export class ChildContext extends AppContext {
  isChild = true;
}
