import * as FS from '@epdoc/fs/fs';
import type * as Ctx from '../context/mod.ts';
import type { ListOpts, ProcessOpts } from './types.ts';

export class AppMain {
  ctx: Ctx.Context;

  constructor(ctx: Ctx.Context) {
    this.ctx = ctx;
  }

  async listFiles(files: string[], opts: ListOpts): Promise<void> {
    if (files.length === 0) {
      this.ctx.log.info.text('No files specified').emit();
      return;
    }

    for (const file of files) {
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
        this.ctx.log.info.fileOp(fsItem, size, units).emit();
      }
    }
  }

  processNothing(args: string[], opts: ProcessOpts): Promise<void> {
    this.ctx.log.info.label('args').value(JSON.stringify(args)).emit();
    this.ctx.log.info.label('opts').value(JSON.stringify(opts)).emit();
    return Promise.resolve();
  }
}
