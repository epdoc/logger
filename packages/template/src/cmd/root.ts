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
  helpText(): string {
    const msg = new Ctx.CustomMsgBuilder();
    msg.h1('\nNotes:\n');
    msg.h2('\nDates are determined by:');
    msg.label('\n    Image').iarrow().value('EXIF data');
    msg.label('\n      PDF').iarrow().value('PDF metadata createdAt');
    msg.label('\n    Video').iarrow().value('FFProbe looks for creation datetime');
    msg.label('\n Fallback').iarrow().value('File system creation datetime');
    return msg.format();
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
