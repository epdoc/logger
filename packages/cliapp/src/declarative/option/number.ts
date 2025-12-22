import { BaseOption } from './base.ts';

export class NumberOption extends BaseOption<number> {
  parse(value: string): number {
    const num = Number(value);
    if (isNaN(num)) throw new Error(`Invalid number: ${value}`);
    return num;
  }
}
