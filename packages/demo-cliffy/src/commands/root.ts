/**
 * @file Root command for demo-cliffy
 */

import { Command } from '@cliffy/command';
import { AppContext } from '../context.ts';
import { CliffApp } from '../dep.ts';
import { createSubCommand } from './sub.ts';

export function createRootCommand(ctx: AppContext) {
  const root = new Command()
    .name(ctx.pkg.name)
    .version(ctx.pkg.version)
    .description(ctx.pkg.description!)
    .action(() => {
      root.showHelp();
    });

  // Add standard logging options from cliffapp
  CliffApp.addLoggingOptions(root, ctx);

  // Add subcommands
  root.command('sub', createSubCommand(ctx));

  return root;
}
