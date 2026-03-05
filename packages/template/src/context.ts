import * as CliApp from '@epdoc/cliapp';
import type * as Log from '@epdoc/logger';

/**
 * Custom message builder demonstrating extension of the base builder.
 *
 * Adds application-specific formatting methods for consistent logging.
 */
export class CustomMsgBuilder extends CliApp.Ctx.MsgBuilder {}
// export type CustomLogger = CliApp.Ctx.Logger;

/**
 * Bump-specific context class.
 */
export class Context extends CliApp.Ctx.AbstractBase {
  declare app: unknown;
  format: string = 'text';

  protected override builderClass = CustomMsgBuilder;

  constructor(
    pkg: CliApp.DenoPkg | Context,
    params: Log.IGetChildParams = {},
  ) {
    super(pkg, params);
    if (pkg instanceof Context) {
      this.copyProperties(pkg);
    }
  }
}

export abstract class BaseClass extends CliApp.BaseClass<Context, CustomMsgBuilder, CliApp.Ctx.Logger> {}

export abstract class BaseRootCmdClass<TOpts extends CliApp.CmdOptions>
  extends CliApp.Cmd.AbstractBase<Context, Context, TOpts> {}
