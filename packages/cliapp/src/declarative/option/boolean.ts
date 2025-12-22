import { BaseOption } from './base.ts';

export class BooleanOption extends BaseOption<boolean> {
  #inverted = false;

  inverted(value = true): this {
    this.#inverted = value;
    return this;
  }

  parse(_value: string): boolean {
    return !this.#inverted; // Return false for --no- flags, true for regular flags
  }
}
