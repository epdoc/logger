import * as FS from '@epdoc/fs/fs';
import * as Ctx from '../context.ts';
import type { ListOpts, ProcessOpts } from './types.ts';

export class AppMain extends Ctx.BaseClass {
  async listFiles(opts: ListOpts): Promise<void> {
    this.section('Listing files').emit();
    if (opts.files.length === 0) {
      this.info.text('No files specified').emit();
      return;
    }

    for (const file of opts.files) {
      const fs = new FS.Spec(file);
      const fsItem = await fs.resolvedType();
      if (fsItem) {
        let size = 0;
        let units = 'byte';
        if (fsItem instanceof FS.File) {
          size = await fsItem.size() ?? 0;
          if (opts.humanize) {
            size = size / 1024;
            units = 'kByte';
          }
        }
        this.info.fileOp(fsItem, size, units).emit();
      }
    }
    this.info.section().emit();
  }

  processNothing(opts: ProcessOpts): void {
    this.info.section('Processing nothing').emit();
    this.info.opts(opts).emit();
    this.info.section().emit();
  }
}
