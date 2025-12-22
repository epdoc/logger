import { BaseOption } from './base.ts';

export class DateOption extends BaseOption<Date> {
  parse(value: string): Date {
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
    return date;
  }
}
