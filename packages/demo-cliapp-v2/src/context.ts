import * as CliApp from '@epdoc/cliapp';
import type * as Log from '@epdoc/logger';
import { _, type Integer } from '@epdoc/type';

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
  happy(ctx: AppContext): this {
    return ctx.happyMode ? this.success('We are HAPPY!') : this.error('It is a sad day');
  }

  opts(opts: CliApp.CmdOptions, args?: CliApp.CmdArgs): this {
    this.label('Command Options:').value(JSON.stringify(opts));
    if (args) {
      this.label('args').value(JSON.stringify(args));
    }
    return this;
  }

  context(ctx: AppContext): this {
    return this.label(ctx.constructor.name).value(JSON.stringify(_.omit(ctx, ['log', 'logMgr', 'pkg'])));
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
  happyMode = false;

  protected override builderClass = CustomMsgBuilder;

  constructor(
    pkg: CliApp.DenoPkg | AppContext,
    params: Log.IGetChildParams = {},
  ) {
    super(pkg, params);
    if (pkg instanceof AppContext) {
      this.copyProperties(pkg);
    }
  }
}

/**
 * Child context demonstrating context inheritance.
 */
export class ChildContext extends AppContext {
  isChild = true;
  time: Integer = 0;

  constructor(parent: AppContext, params: Log.IGetChildParams = {}) {
    super(parent, params);
  }
}
