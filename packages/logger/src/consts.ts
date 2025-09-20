import { _ } from '@epdoc/type';
import type { TimestampFormatType } from './types.ts';

/**
 * Defines the available formats for displaying timestamps in log output.
 */
export const TimestampFormat = {
  /** Coordinated Universal Time (UTC) format. */
  UTC: 'utc',
  /** Local time zone format. */
  LOCAL: 'local',
  /** Time elapsed since the logger was initialized. */
  ELAPSED: 'elapsed',
} as const;

const timestampFormatValues = Object.values(TimestampFormat);
/**
 * Type guard to check if a value is a valid {@link TimestampFormat}.
 *
 * @param {unknown} val - The value to check.
 * @returns {boolean} `true` if the value is a valid timestamp format.
 * @internal
 */
export function isTimestampFormat(val: unknown): val is TimestampFormatType {
  return _.isString(val) && (timestampFormatValues as readonly string[]).includes(val);
}
