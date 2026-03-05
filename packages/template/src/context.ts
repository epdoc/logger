import * as CliApp from '@epdoc/cliapp';
import type * as Log from '@epdoc/logger';
import * as Progress from './progress/mod.ts';

/**
 * Custom message builder demonstrating extension of the base builder.
 *
 * Adds application-specific formatting methods for consistent logging.
 */
export class CustomMsgBuilder extends CliApp.Ctx.MsgBuilder {
  start(): void {}
  stop(): void {}
}
// export type CustomLogger = CliApp.Ctx.Logger;

/**
 * Bump-specific context class.
 */
export class Context extends CliApp.Ctx.AbstractBase {
  declare app: unknown;
  format: string = 'text';
  #progress?: Progress.Monitor;

  protected override builderClass = Progress.MsgBuilder;

  constructor(
    pkg: CliApp.DenoPkg | Context,
    params: Log.IGetChildParams = {},
  ) {
    super(pkg, params);
    if (pkg instanceof Context) {
      this.copyProperties(pkg);
    }
  }

  get progress(): Progress.Monitor {
    if (this.#progress) {
      return this.#progress;
    }
    this.#progress = new Progress.Monitor(this);
    return this.#progress;
  }
}

export abstract class BaseClass extends CliApp.BaseClass<Context, Progress.MsgBuilder, CliApp.Ctx.Logger> {}

export abstract class BaseRootCmdClass<TOpts extends CliApp.CmdOptions>
  extends CliApp.Cmd.AbstractBase<Context, Context, TOpts> {}
