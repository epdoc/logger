# @epdoc/template

This is a template for a new @epdoc/cliapp-based command. The command can be run on it's own or included as a
subcommand.

## To create a new command using this template:

1. Choose a name for your new command (e.g. `sync`)
2. Copy the entire `template` folder to create a new workspace in your monorepo, giving the folder the name `sync`.
3. If you are implementing one command in this module:
   1. Delete `src/cmd/root-with-subs.ts`.
   2. Delete the `if( Deno.args.includes('--sub') )` block from `src/main.ts`
   3. Replace all instances of 'Template' with the string `Sync`:
      - `TemplateTool` becomes `SyncTool`
      - `TemplateOptions` becomes `SyncOptions`
      - `TemplateCommand` becomes `SyncCommand`
      - `TemplateCmdOptions` becomes `SyncCmdOptions`
4. If you want to declaratively define a command with subcommand implementations in this module:
   1. Delete `src/cmd/root.ts`, and use `root-with-subs.ts` instead
   2. Delete the condition `if( Deno.args.includes('--sub') )` from `src/main.ts` and remove the `else` block of code
   3. Modify TREE with your command hierarchy

5. Edit `deno.json` and change the `name`, `description`, `version` and any other properties you wish to change.

## To nest this command inside another command

Add

```ts
  import * as Template from '../../template/src/mod.ts';

  protected override getSubCommands() {
    return [
      new Template.Cmd.Root(this.ctx, { name: 'template' }),
    ];
  }
```

## To use as a root command

1. If you define any global options (beyond `dryRun` and logging options), you will want to create a `hydrateContext`
   method with which to read those options and set them on the context.

   ```ts
    override hydrateContext(opts: RootOptions, _args: CliApp.CmdArgs): void {
     if (opts.json) {
       this.ctx.format = 'json';
     }
   }
   ```

## Don't forget your Context

You can copy [context.ts](../common/src/context.ts) to use as your context file.
