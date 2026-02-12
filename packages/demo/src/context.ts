import * as CliApp from '@epdoc/cliapp';
import * as FS from '@epdoc/fs/fs';
import type * as Log from '@epdoc/logger';
import { _, type Dict } from '@epdoc/type';
import * as App from './app/mod.ts';

/**
 * Custom message builder demonstrating extension of the base builder.
 *
 * Adds application-specific formatting methods for consistent logging.
 */
export class CustomMsgBuilder extends CliApp.Ctx.MsgBuilder {
  fileOp(item: FS.Typed, size: number = 0, units = 'byte') {
    if (item instanceof FS.Folder) {
      return this.label('Folder:').relative(item.path);
    } else if (item instanceof FS.File) {
      return this.label('File:').relative(item.path).count(Math.round(size))
        .text(units);
    }
    return this; // Always return this for method chaining
  }

  logShow(ctx: RootContext): this {
    return this.label(ctx.constructor.name).label('logMgr.show').value(JSON.stringify(ctx.logMgr.show));
  }

  opts(opts: Dict, name?: string): this {
    return this.label(name ? name + ':' : 'Options:').value(JSON.stringify(opts));
  }
  demo(ctx: RootContext): this {
    // deno-lint-ignore no-explicit-any
    const id = (ctx as any).__uid ??= crypto.randomUUID().slice(0, 8); // First 8 chars
    return this.label('name:').value(ctx.constructor.name)
      .label('id:').value(id) // Shows "a1b2c3d4"
      .label('properties:').value(JSON.stringify(_.omit(ctx, ['log', 'logMgr', 'pkg', 'app'])));
  }
}

type CustomLogger = CliApp.Ctx.Logger;

/**
 * Application context with custom message builder support.
 *
 * Extends AbstractBase from cliapp to inherit all standard context functionality
 * including logging setup, dry-run support, and package information.
 */
export class RootContext extends CliApp.Ctx.AbstractBase<CustomMsgBuilder, CustomLogger> {
  app!: App.Main;
  name?: string;
  happyMode = false;

  protected override builderClass = CustomMsgBuilder;

  constructor(
    pkg: CliApp.DenoPkg | RootContext,
    params: Log.IGetChildParams = {},
  ) {
    super(pkg, params);
    if (pkg instanceof RootContext) {
      this.copyProperties(pkg);
    }
    if (!this.app) {
      this.app = new App.Main(this);
    }
  }
}

/**
 * Child context demonstrating context inheritance.
 * If you are happy using just one context class, you can skip this.
 */
export class QueryContext extends RootContext {
  isProcess = true;
  more = false;
  apis: App.Api[] = [];

  constructor(
    parent: RootContext,
    params: Log.IGetChildParams = { pkg: 'query' },
  ) {
    super(parent, params);
  }
}

export abstract class BaseClass extends CliApp.BaseClass<RootContext, CustomMsgBuilder, CustomLogger> {}

export abstract class BaseRootCmdClass<TOpts extends CliApp.CmdOptions>
  extends CliApp.Cmd.AbstractBase<RootContext, RootContext, TOpts> {}

export type QueryCmdOpts = {
  more: boolean;
};

export abstract class BaseQueryCmdClass extends CliApp.Cmd.AbstractBase<QueryContext, RootContext, QueryCmdOpts> {}
