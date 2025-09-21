import { Transport, Mgr as LogMgr } from '@epdoc/logger';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import type { Entry } from '@epdoc/logger';

/**
 * Configuration options for the Logdy transport.
 */
export interface LogdyTransportOptions extends Transport.Base.Options {
  /** Logdy API endpoint URL */
  url?: string;
  /** Optional API key for authentication */
  apiKey?: string;
  /** Number of logs to batch before sending */
  batchSize?: number;
  /** Milliseconds between automatic flushes */
  flushInterval?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts for failed requests */
  retryAttempts?: number;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
}

/**
 * Logdy log entry format for HTTP API.
 */
interface LogdyLogEntry {
  timestamp: string;
  level: string;
  message: string;
  fields?: Record<string, unknown>;
}

/**
 * Transport for streaming logs to Logdy web interface via HTTP API.
 * 
 * @remarks
 * This transport sends logs to a Logdy instance using the HTTP API.
 * It supports batching, retries, and graceful error handling.
 * 
 * @example
 * ```ts
 * import { Mgr as LogMgr } from '@epdoc/logger';
 * import { LogdyTransport } from '@epdoc/logdy';
 * 
 * const logMgr = new LogMgr();
 * const transport = new LogdyTransport(logMgr, {
 *   url: 'http://localhost:8080/api/v1/logs',
 *   batchSize: 50
 * });
 * 
 * logMgr.addTransport(transport);
 * ```
 */
export class LogdyTransport extends Transport.Base.Transport {
  public override readonly type = 'logdy';
  
  private readonly _url: string;
  private readonly _apiKey?: string;
  private readonly _batchSize: number;
  private readonly _flushInterval: number;
  private readonly _timeout: number;
  private readonly _retryAttempts: number;
  private readonly _headers: Record<string, string>;
  
  private _logQueue: LogdyLogEntry[] = [];
  private _flushTimer?: number;
  private _isDestroyed = false;

  /**
   * Creates a new Logdy transport instance.
   * 
   * @param logMgr - The log manager instance
   * @param options - Configuration options
   */
  constructor(logMgr: LogMgr<any>, options: LogdyTransportOptions = {}) {
    super(logMgr, options);
    
    this._url = options.url ?? 'http://localhost:8080/api/v1/logs';
    this._apiKey = options.apiKey;
    this._batchSize = options.batchSize ?? 50;
    this._flushInterval = options.flushInterval ?? 2000;
    this._timeout = options.timeout ?? 5000;
    this._retryAttempts = options.retryAttempts ?? 2;
    this._headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this._apiKey) {
      this._headers['Authorization'] = `Bearer ${this._apiKey}`;
    }
    
    this._startFlushTimer();
  }

  /**
   * Sets up the transport for logging.
   */
  override setup(): Promise<void> {
    this._bReady = true;
    return Promise.resolve();
  }

  /**
   * Emits a log entry to Logdy.
   * 
   * @param entry - The log entry to emit
   */
  override emit(entry: Entry): void {
    if (!this._bReady || this._isDestroyed) {
      return;
    }

    const logdyEntry = this._convertToLogdyFormat(entry);
    this._logQueue.push(logdyEntry);

    if (this._logQueue.length >= this._batchSize) {
      this._flush();
    }
  }

  /**
   * Gracefully shuts down the transport.
   */
  override stop(): Promise<void> {
    this._stopFlushTimer();
    return this._flush();
  }

  /**
   * Destroys the transport and cleans up resources.
   */
  override async destroy(): Promise<void> {
    this._isDestroyed = true;
    this._stopFlushTimer();
    await this._flush(); // Send any remaining logs
  }

  /**
   * Converts a logger Entry to Logdy format.
   */
  private _convertToLogdyFormat(entry: Entry): LogdyLogEntry {
    const logdyEntry: LogdyLogEntry = {
      timestamp: entry.timestamp?.toISOString() ?? new Date().toISOString(),
      level: this._mapLogLevel(entry.level),
      message: this._extractMessage(entry),
    };

    // Add structured fields
    const fields: Record<string, unknown> = {};
    
    if (entry.sid) fields.sid = entry.sid;
    if (entry.reqIds?.length) fields.reqIds = entry.reqIds;
    if (entry.pkgs?.length) fields.pkgs = entry.pkgs;
    if (entry.data) fields.data = entry.data;

    if (Object.keys(fields).length > 0) {
      logdyEntry.fields = fields;
    }

    return logdyEntry;
  }

  /**
   * Maps logger levels to Logdy severity levels.
   */
  private _mapLogLevel(level: string): string {
    const levelMap: Record<string, string> = {
      'FATAL': 'error',
      'CRITICAL': 'error', 
      'ERROR': 'error',
      'SEVERE': 'error',
      'WARN': 'warn',
      'WARNING': 'warn',
      'INFO': 'info',
      'CONFIG': 'info',
      'HELP': 'info',
      'DATA': 'info',
      'DEBUG': 'debug',
      'VERBOSE': 'debug',
      'TRACE': 'debug',
      'FINE': 'debug',
      'FINER': 'debug',
      'FINEST': 'debug',
      'SPAM': 'debug',
      'SILLY': 'debug',
    };

    return levelMap[level.toUpperCase()] ?? 'info';
  }

  /**
   * Extracts message text from Entry.
   */
  private _extractMessage(entry: Entry): string {
    if (typeof entry.msg === 'string') {
      return entry.msg;
    }
    
    if (entry.msg && typeof entry.msg === 'object' && 'format' in entry.msg) {
      try {
        return entry.msg.format({ color: false });
      } catch {
        return '[Message formatting error]';
      }
    }
    
    return '[No message]';
  }

  /**
   * Flushes the current log queue to Logdy.
   */
  private async _flush(): Promise<void> {
    if (this._logQueue.length === 0 || this._isDestroyed) {
      return;
    }

    const logsToSend = [...this._logQueue];
    this._logQueue = [];

    try {
      await this._sendLogs(logsToSend);
    } catch (error) {
      // Re-queue logs on failure for retry
      this._logQueue.unshift(...logsToSend);
      console.error('Logdy transport error:', error);
    }
  }

  /**
   * Sends logs to Logdy with retry logic.
   */
  private async _sendLogs(logs: LogdyLogEntry[], attempt = 1): Promise<void> {
    // Send each log individually as Logdy expects single messages
    for (const log of logs) {
      await this._sendSingleLog(log, attempt);
    }
  }

  /**
   * Sends a single log to Logdy with retry logic.
   */
  private async _sendSingleLog(log: LogdyLogEntry, attempt = 1): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this._timeout);

    try {
      const response = await fetch(this._url, {
        method: 'POST',
        headers: this._headers,
        body: JSON.stringify({
          message: log.message,
          level: log.level,
          timestamp: log.timestamp
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (attempt < this._retryAttempts) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._sendSingleLog(log, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Starts the automatic flush timer.
   */
  private _startFlushTimer(): void {
    this._flushTimer = setInterval(() => {
      this._flush();
    }, this._flushInterval);
  }

  /**
   * Stops the automatic flush timer.
   */
  private _stopFlushTimer(): void {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = undefined;
    }
  }
}
