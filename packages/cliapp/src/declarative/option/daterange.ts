import { BaseOption } from './base.ts';

// Assuming @epdoc/daterange exports a DateRange class and parse function
// You would import these from your actual library
interface DateRange {
  start: Date;
  end: Date;
}

export class DateRangeOption extends BaseOption<DateRange> {
  parse(value: string): DateRange {
    // Replace this with actual @epdoc/daterange parsing logic
    // Example: return parseDateRange(value);
    throw new Error('Import and use @epdoc/daterange parsing logic here');
  }
}
