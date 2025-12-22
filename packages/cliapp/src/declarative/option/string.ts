import { BaseOption } from './base.ts';

export class StringOption extends BaseOption<string> {
  parse(value: string): string {
    return value;
  }
}
