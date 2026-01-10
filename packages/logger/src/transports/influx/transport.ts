import type { Entry } from '$log';
import type { Milliseconds } from '@epdoc/duration';
import type * as Level from '@epdoc/loglevels';
import * as MsgBuilder from '@epdoc/msgbuilder';
import { _, type Integer } from '@epdoc/type';
import * as Base from '../base/mod.ts';
import type { ILogMgrTransportContext } from '../types.ts';
import type * as Influx from './types.ts';

export class InfluxTransport extends Base.Transport {
  public override readonly type: string = 'influx';
  protected override _opts: Influx.Options;
  #buffer: string[] = [];
  #batchSize: Integer;
  #flushInterval: Milliseconds;
  #maxRetries: Integer;
  #retryBaseDelay: Milliseconds;
  #flushTimer?: number;
  #isTransmitting = false;
  #hostname: string;
  #droppedStats: Influx.DroppedMessageStats | null = null;

  constructor(logMgr: ILogMgrTransportContext, opts: Influx.Options) {
    super(logMgr, opts);
    this._opts = opts;
    this._bReady = true;
    this.#hostname = opts.hostname || this.#getHostname();
    this.#batchSize = opts.batchSize ?? 100;
    this.#flushInterval = opts.flushInterval ?? 2000;
    this.#maxRetries = opts.maxRetries ?? 3;
    this.#retryBaseDelay = opts.retryBaseDelay ?? 1000;
    this.#startFlushTimer();
  }

  override toString(): string {
    return `Influx[${this._opts.host}/${this._opts.org}/${this._opts.bucket}]`;
  }

  override emit(entry: Entry): void {
    const levelValue: Level.Value = this._logMgr.logLevels.asValue(entry.level);
    if (!this.meetsThresholdValue(levelValue)) return;
    if (!entry.timestamp) return;

    // 1. Tags (low cardinality, good for filtering)
    const tags = new Map<string, string>();
    tags.set('level', entry.level.toUpperCase()); // Standardize to uppercase
    if (this._opts.service) tags.set('service', this._opts.service);
    if (this._opts.environment) tags.set('environment', this._opts.environment);
    tags.set('host', this.#hostname);
    if (entry.pkg) tags.set('package', entry.pkg);

    // 2. Fields (high cardinality data)
    const fields = new Map<string, string | number | boolean>();

    // Process the message body
    if (entry.msg instanceof MsgBuilder.Abstract) {
      fields.set('message', entry.msg.format({ color: false, target: 'json' }));
    } else if (_.isString(entry.msg)) {
      fields.set('message', entry.msg);
    }

    // Move high-cardinality identifiers to fields
    if (entry.reqId) fields.set('request_id', entry.reqId);
    if (entry.sid) fields.set('session_id', entry.sid);

    // Process extra data attributes
    if (_.isDict(entry.data)) {
      for (const [key, value] of Object.entries(entry.data)) {
        const val = this.#isPrimitive(value) ? value : JSON.stringify(value);
        if (val !== undefined && val !== null) {
          fields.set(`data_${key}`, val as string | number | boolean);
        }
      }
    }

    // Keep duration in milliseconds (more intuitive than nanoseconds)
    if (_.isDefined(entry.time)) {
      fields.set('duration_ms', entry.time!);
    }

    const timestampNs = (entry.timestamp.getTime() * 1_000_000).toString();
    const line = this.#formatLineProtocol(tags, fields, timestampNs);
    this.#addToBuffer(line);
  }

  override async stop(): Promise<void> {
    if (this.#flushTimer) {
      clearInterval(this.#flushTimer);
      this.#flushTimer = undefined;
    }
    await this.flush();
  }

  #startFlushTimer(): void {
    this.#flushTimer = setInterval(() => {
      this.flush();
    }, this.#flushInterval);
  }

  #addToBuffer(line: string): void {
    this.#buffer.push(line);
    if (this.#buffer.length >= this.#batchSize) {
      this.flush();
    }
  }

  override async flush(): Promise<void> {
    if (this.#isTransmitting) return;

    // Send dropped message summary first if we have one
    if (this.#droppedStats) {
      const summaryLine = this.#createDroppedSummaryLine();
      if (summaryLine) {
        this.#isTransmitting = true;
        try {
          await this.#transmitBatch([summaryLine], 1); // Single retry for summary
          this.#droppedStats = null; // Clear on success
        } catch (_err) {
          // Keep trying to send summary
        } finally {
          this.#isTransmitting = false;
        }
      }
    }

    if (this.#buffer.length === 0 || this.#isTransmitting) return;

    const lines = this.#buffer.splice(0);
    if (lines.length === 0) return;

    this.#isTransmitting = true;
    try {
      await this.#transmitBatch(lines, this.#maxRetries);
    } catch (_err) {
      // Track dropped messages
      this.#trackDroppedMessages(lines);
    } finally {
      this.#isTransmitting = false;
    }
  }

  #formatLineProtocol(tags: Map<string, string>, fields: Map<string, unknown>, timestamp: string): string {
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
    return line;
  }

  async #transmitBatch(lines: string[], maxRetries = this.#maxRetries): Promise<void> {
    if (!this._opts.host || !this._opts.token) return;

    const url = new URL('/api/v2/write', this._opts.host);
    url.searchParams.append('org', this._opts.org || '');
    url.searchParams.append('bucket', this._opts.bucket || '');
    url.searchParams.append('precision', 'ns');

    const body = lines.join('\n');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${this._opts.token}`,
            'Content-Type': 'text/plain; charset=utf-8',
          },
          body,
        });

        if (response.status === 204) {
          return; // Success
        } else {
          throw new Error(`InfluxDB Write Failed [${response.status}]: ${await response.text()}`);
        }
      } catch (err) {
        if (attempt === maxRetries) {
          // Only log in non-test environments
          if (!globalThis.Deno?.test) {
            console.error('InfluxDB Connection Error (final attempt):', err);
          }
          throw err;
        }
        // Exponential backoff
        await this.#delay(Math.pow(2, attempt) * this.#retryBaseDelay);
      }
    }
  }

  #delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  #getHostname(): string {
    try {
      return Deno.hostname();
    } catch {
      return 'unknown';
    }
  }

  #escapeKey(val: string): string {
    return val.replace(/[ ,=]/g, '\\$&');
  }

  #isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
  }

  #trackDroppedMessages(lines: string[]): void {
    const now = new Date();

    if (!this.#droppedStats) {
      this.#droppedStats = {
        total: 0,
        first: now,
        last: now,
        byLevel: {},
      };
    }

    this.#droppedStats.total += lines.length;
    this.#droppedStats.last = now;

    // Extract levels from line protocol
    for (const line of lines) {
      const levelMatch = line.match(/level=([A-Z]+)/);
      if (levelMatch) {
        const level = levelMatch[1].toLowerCase();
        this.#droppedStats.byLevel[level] = (this.#droppedStats.byLevel[level] || 0) + 1;
      }
    }
  }

  #createDroppedSummaryLine(): string | null {
    if (!this.#droppedStats) return null;

    const tags = new Map<string, string>();
    tags.set('level', 'WARN');
    if (this._opts.service) tags.set('service', this._opts.service);
    if (this._opts.environment) tags.set('environment', this._opts.environment);
    tags.set('host', this.#hostname);
    tags.set('package', 'logger.influx');

    const fields = new Map<string, string | number | boolean>();
    fields.set('message', `${this.#droppedStats.total} log messages could not be transmitted`);

    // Serialize dropped data as JSON (same logic as lines 66-73)
    const droppedData = {
      first: this.#droppedStats.first.toISOString(),
      last: this.#droppedStats.last.toISOString(),
      total: this.#droppedStats.total,
      ...this.#droppedStats.byLevel,
    };
    fields.set('data_dropped', JSON.stringify(droppedData));

    const timestampNs = (Date.now() * 1_000_000).toString();
    return this.#formatLineProtocol(tags, fields, timestampNs);
  }
}
