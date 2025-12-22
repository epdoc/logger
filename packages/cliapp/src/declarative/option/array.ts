import { BaseOption } from './base.ts';

export class ArrayOption extends BaseOption<string[]> {
  parse(value: string): string[] {
    return value.split(',').map((s) => s.trim());
  }
}
