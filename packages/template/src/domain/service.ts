import { _ } from '@epdoc/type';
import { Ctx } from '../deps.ts';
import type { TemplateOptions } from './types.ts';

/**
 * Synchronizes MCP server definitions from the OpenCode servers directory
 * to one or more AI tool configuration files.
 *
 * Reads individual server JSON files from `~/.config/opencode/servers/`,
 * transforms them to each target's expected format, and merges the MCP
 * section into the target's settings file (preserving all other settings).
 */
export class TemplateTool extends Ctx.BaseClass {
  opts: TemplateOptions;

  constructor(ctx: Ctx.Context, opts: TemplateOptions) {
    super(ctx);
    this.opts = opts;
  }

  run(): void {
    this.info.section('TemplateTool').emit();
    if (this.ctx.dryRun) {
      this.info.ialert().text('Dry run mode - no changes will be made').emit();
    }

    if (_.isNonEmptyArray(this.opts.files)) {
      this.info.h1('Processing').count(this.opts.files.length).h1('File')
        .emit();
      this.log.indent();
      for (const file in this.opts.files) {
        this.info.label('File:').value(file).emit();
      }
      this.log.outdent();
    }
    this.info.section().emit();
  }
}
