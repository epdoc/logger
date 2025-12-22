/**
 * Base option class for CLI command options
 */
export abstract class BaseOption<T = unknown> {
  #default?: T;
  #required = false;
  #choices?: readonly string[];

  constructor(
    public flags: string,
    public description: string,
  ) {}

  default(value: T): this {
    this.#default = value;
    return this;
  }

  required(): this {
    this.#required = true;
    return this;
  }

  choices(values: readonly string[]): this {
    this.#choices = values;
    return this;
  }

  getDefault(): T | undefined {
    return this.#default;
  }

  isRequired(): boolean {
    return this.#required;
  }

  getChoices(): readonly string[] | undefined {
    return this.#choices;
  }

  abstract parse(value: string): T;
}
