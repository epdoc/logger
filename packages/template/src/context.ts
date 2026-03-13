/**
 * Context for template CLI applications.
 *
 * This context demonstrates how to set up a CLI application with progress
 * indicator support using @epdoc/cliapp's ProgressMsgBuilder.
 */
import * as CliApp from '@epdoc/cliapp';
import type * as Log from '@epdoc/logger';

export class CustomMsgBuilder extends CliApp.Progress.MsgBuilder {
  /**
   * Creates a CustomMsgBuilder instance.
   *
   * @remarks
   * This constructor is normally called by the @epdoc/cliapp library with a
   * fully-configured ProgressEmitter. However, for standalone usage (e.g., building
   * help text without a logger), the emitter parameter can be omitted. In that case,
   * progress indicator methods (start, update, complete) will not function, but all
   * formatting methods from Console.Builder (h1, h2, label, value, etc.) work normally.
   *
   * @param emitter - The progress emitter from the logger (optional for standalone use)
   */
  constructor(emitter?: CliApp.Progress.ProgressEmitter) {
    // Provide a minimal mock emitter for standalone usage
    const actualEmitter = emitter ?? CliApp.Progress.createStandaloneProgressEmitter();
    super(actualEmitter);
  }
}

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

/**
 * Base class for template applications.
 */
export abstract class BaseClass extends CliApp.BaseClass<Context, CustomMsgBuilder, CliApp.Ctx.Logger> {}

/**
 * Base class for root commands in template applications.
 */
export abstract class BaseRootCmdClass<TOpts extends CliApp.CmdOptions>
  extends CliApp.Cmd.AbstractBase<Context, Context, TOpts> {}
