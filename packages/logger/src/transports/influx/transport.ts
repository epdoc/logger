import type { Entry } from '$log';
import type * as Level from '@epdoc/loglevels';
import * as MsgBuilder from '@epdoc/msgbuilder';
import { _ } from '@epdoc/type';
import * as Console from '../console/mod.ts';
import type { ILogMgrTransportContext } from '../types.ts';
import type * as Influx from './types.ts';

export class InfluxTransport extends Console.Transport {
  public override readonly type: string = 'influx';
  override _opts: Influx.Options;

  constructor(logMgr: ILogMgrTransportContext, opts: Influx.Options) {
    super(logMgr, opts);
    this._opts = opts;
  }

  override toString(): string {
    return `Influx[${this._opts.host}/${this._opts.org}/${this._opts.bucket}]`;
  }

  override emit(entry: Entry): void {
    const levelValue: Level.Value = this._logMgr.logLevels.asValue(entry.level);
    if (!this.meetsThresholdValue(levelValue)) return;
    if (!entry.timestamp) return;

    // 1. Identify Tags (Metadata for filtering)
    const tags = new Map<string, string>();
    tags.set('severity', entry.level);
    if (entry.pkg) tags.set('pkg', entry.pkg);
    if (entry.reqId) tags.set('reqId', entry.reqId);
    if (entry.sid) tags.set('sid', entry.sid);

    // 2. Identify Fields (Actual data values)
    const fields = new Map<string, string | number | boolean>();

    // Process the message body
    if (entry.msg instanceof MsgBuilder.Abstract) {
      fields.set('body', entry.msg.format({ color: false, target: 'json' }));
    } else if (_.isString(entry.msg)) {
      fields.set('body', entry.msg);
    }

    // Process extra data attributes
    if (_.isDict(entry.data)) {
      for (const [key, value] of Object.entries(entry.data)) {
        const val = this.#isPrimitive(value) ? value : JSON.stringify(value);
        if (val !== undefined && val !== null) {
          fields.set(`data_${key}`, val as string | number | boolean);
        }
      }
    }

    if (_.isDefined(entry.time)) {
      fields.set('duration_ns', Math.round(entry.time! * 1_000_000));
    }

    const timestampNs = (entry.timestamp.getTime() * 1_000_000).toString();
    this.#transmit(tags, fields, timestampNs);
  }

  async #transmit(tags: Map<string, string>, fields: Map<string, unknown>, timestamp: string) {
    if (!this._opts.host || !this._opts.token) return;

    // InfluxDB Line Protocol Endpoint
    const url = new URL('/api/v2/write', this._opts.host);
    url.searchParams.append('org', this._opts.org || '');
    url.searchParams.append('bucket', this._opts.bucket || '');
    url.searchParams.append('precision', 'ns');

    // Construct Line Protocol string: measurement,tag=val field=val timestamp
    let line = 'logs';

    for (const [k, v] of tags) {
      line += `,${this.#escapeKey(k)}=${this.#escapeKey(v)}`;
    }

    line += ' '; // Separator between tags and fields

    const fieldEntries = Array.from(fields.entries()).map(([k, v]) => {
      const value = typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : v;
      return `${this.#escapeKey(k)}=${value}`;
    });
    line += fieldEntries.join(',');

    line += ` ${timestamp}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this._opts.token}`,
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: line,
      });

      if (response.status !== 204) {
        console.error(`InfluxDB Write Failed [${response.status}]: ${await response.text()}`);
      }
    } catch (err) {
      console.error('InfluxDB Connection Error:', err);
    }
  }

  #escapeKey(val: string): string {
    return val.replace(/[ ,=]/g, '\\$&');
  }

  #isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
  }
}
