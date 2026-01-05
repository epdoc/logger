import type { Entry } from '$log';
import type * as Level from '@epdoc/loglevels';
import * as MsgBuilder from '@epdoc/msgbuilder';
import { _ } from '@epdoc/type';
import type { LogRecord } from '@opentelemetry/api-logs';
import * as Console from '../console/mod.ts';

export class OtlpTransport extends Console.Transport {
  override toString(): string {
    return 'OTLP';
  }

  override emit(entry: Entry): void {
    const levelValue: Level.Value = this._logMgr.logLevels.asValue(entry.level);
    if (!this.meetsThresholdValue(levelValue)) {
      return;
    }

    // assert(msg.timestamp,'No timestamp')

    const result: LogRecord = {
      timestamp: entry.timestamp,
      severityText: entry.level,
      severityNumber: this._logMgr.logLevels.asSeverityNumber(entry.level),
    };

    if (entry.sid || entry.reqId || entry.pkg || entry.data || _.isDefined(entry.time)) {
      result.attributes = {};
      if (entry.reqId) {
        result.attributes['request.id'] = entry.reqId;
      }
      if (entry.sid) {
        result.attributes['session.id'] = entry.sid;
      }
      if (entry.pkg) {
        result.attributes['code.namespace'] = entry.pkg;
      }
      if (_.isDict(entry.data) && !_.isEmpty(entry.data)) {
        result.attributes['extra_data'] = OtlpTransport.#flattenOtlpData(entry.data, 'data');
      }
      if (_.isDefined(entry.time)) {
        // high resolution milliseconds converted to nanoseconds
        result.attributes['event.duration'] = entry.time! * 1000;
      }
    }

    if (entry.msg instanceof MsgBuilder.Abstract) {
      result.body = entry.msg.format({ color: false, target: 'json' });
    } else if (_.isString(entry.msg)) {
      result.body = entry.msg;
    }

    console.log(result);
  }

  /**
   * Flattens nested data objects for OTLP attributes.
   * @private
   */
  static #flattenOtlpData(data: unknown, prefix = 'data'): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (_.isObject(data) && !_.isArray(data)) {
      for (const [key, value] of Object.entries(data)) {
        const attrKey = `${prefix}.${key}`;
        if (OtlpTransport.#isPrimitive(value)) {
          result[attrKey] = value;
        } else if (_.isArray(value)) {
          result[attrKey] = JSON.stringify(value);
        } else {
          Object.assign(result, OtlpTransport.#flattenOtlpData(value, attrKey));
        }
      }
    } else {
      result[prefix] = OtlpTransport.#isPrimitive(data) ? data : JSON.stringify(data);
    }

    return result;
  }

  /**
   * Checks if a value is a primitive type suitable for OTLP attributes.
   * @private
   */
  static #isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
    return value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean';
  }
}
