/**
 * Context for template CLI applications.
 *
 * This context demonstrates how to set up a CLI application with progress
 * indicator support using @epdoc/cliapp's ProgressMsgBuilder.
 */
import * as CliApp from '@epdoc/cliapp';
import type * as Log from '@epdoc/logger';

/**
 * Template context class with progress support.
 */
export class Context extends CliApp.Ctx.AbstractBase {
  declare app: unknown;
  format: string = 'text';

  /**
   * Use the ProgressMsgBuilder for message building.
   * This enables progress.start(), progress.update(), progress.complete() methods.
   */
  protected override builderClass = CliApp.Progress.MsgBuilder;

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

/**
 * Base class for template applications.
 */
export abstract class BaseClass extends CliApp.BaseClass<Context, CliApp.Progress.MsgBuilder, CliApp.Ctx.Logger> {}

/**
 * Base class for root commands in template applications.
 */
export abstract class BaseRootCmdClass<TOpts extends CliApp.CmdOptions>
  extends CliApp.Cmd.AbstractBase<Context, Context, TOpts> {}
