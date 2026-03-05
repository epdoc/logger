import type * as CliApp from '@epdoc/cliapp';
import type { EmptyDict } from '@epdoc/type';
import { Ctx } from '../deps.ts';
import * as Domain from '../domain/mod.ts';

// If there are no options then use EmptyDict
type TemplateCmdOptions = CliApp.LogCmdOptions & { details: boolean } & EmptyDict;

export class TemplateCommand extends Ctx.BaseRootCmdClass<TemplateCmdOptions> {
  override defineMetadata() {
    this.description = `This description is used when the module is a submodule.`;
    this.name = 'template';
  }

  override defineOptions(): void {
    this.option('--details', 'Provide more details').emit();
    this.argument('[files...]', 'Files to do nothing to').emit();
  }

  override async execute(
    options: TemplateCmdOptions,
    args: CliApp.CmdArgs,
  ): Promise<void> {
    const opts: Domain.TemplateOptions = {
      details: options.details,
      files: args,
    };
    const service = new Domain.TemplateTool(this.ctx, opts);
    await service.run();
  }
}
