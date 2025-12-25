import * as FS from '@epdoc/fs/fs';
import { Console } from '@epdoc/msgbuilder';

// Define project-specific logging methods
export const CustomBuilder = Console.extender({
  fileOp(item: FS.Typed, size: number = 0, units = 'byte') {
    if (item instanceof FS.Folder) {
      return this.label('Folder:').relative(item.path);
    } else if (item instanceof FS.File) {
      return this.label('File:').relative(item.path).count(Math.round(size)).text(units);
    }
    return this; // Always return this for method chaining
  },
});
