import { BaseOption } from './base.ts';

export class PathOption extends BaseOption<string> {
  parse(value: string): string {
    return value; // Could add path validation here
  }
}
