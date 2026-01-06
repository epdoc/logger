import type { Entry } from '$log';
import type * as Level from '@epdoc/loglevels';
import * as MsgBuilder from '@epdoc/msgbuilder';
import { _ } from '@epdoc/type';
import * as Base from '../base/mod.ts';
import type { ILogMgrTransportContext } from '../types.ts';
import type { IBufferEntry, IBufferTransportOptions } from './types.ts';

/**
 * Buffer transport that stores log messages in memory for testing and inspection.
 *
 * @example Basic usage
 * ```typescript
 * const bufferTransport = new BufferTransport(logMgr);
 * logMgr.add(bufferTransport);
 *
 * const logger = logMgr.getLogger();
 * logger.info.text('Test message').emit();
 *
 * // Check captured logs
 * const entries = bufferTransport.getEntries();
 * assertEquals(entries.length, 1);
 * assertStringIncludes(entries[0].message, 'Test message');
 * ```
 */
export class BufferTransport extends Base.Transport {
  public readonly type: string = 'buffer';
  private entries: IBufferEntry[] = [];
  private maxEntries: number;
  private delayReady?: number;

  constructor(logMgr: ILogMgrTransportContext, opts: IBufferTransportOptions = {}) {
    super(logMgr, opts);
    this.maxEntries = opts.maxEntries ?? 1000;
    this.delayReady = opts.delayReady;
    // Don't set ready here - let setup() handle it
  }

  /**
   * Initializes the transport with optional delay for testing.
   */
  override setup(): Promise<void> {
    if (this.delayReady && this.delayReady > 0) {
      // Simulate async setup (e.g., network connection)
      return new Promise(resolve => {
        setTimeout(() => {
          this._bReady = true;
          resolve();
        }, this.delayReady);
      });
    } else {
      this._bReady = true;
      return Promise.resolve();
    }
  }

  /**
   * Returns a string representation of the transport.
   */
  override toString(): string {
    return `Buffer[${this.entries.length}/${this.maxEntries}]`;
  }

  /**
   * Emits a log entry to the buffer.
   */
  override emit(msg: Entry) {
    if (!this._bEnabled) {
      return; // Transport is disabled
    }
    
    const levelValue: Level.Value = this._logMgr.logLevels.asValue(msg.level);
    if (!this.meetsThresholdValue(levelValue)) {
      return;
    }

    // Format the message similar to console transport
    let message = '';
    if (msg.msg instanceof MsgBuilder.Abstract) {
      message = msg.msg.format({ color: false, target: 'console' });
    } else if (_.isString(msg.msg)) {
      message = msg.msg;
    }

    const entry: IBufferEntry = {
      message,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      level: msg.level,
      data: msg.data,
    };

    this.entries.push(entry);

    // Remove oldest entries if we exceed maxEntries
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  /**
   * Get all captured log entries
   */
  getEntries(): readonly IBufferEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by log level
   */
  getEntriesByLevel(level: string): readonly IBufferEntry[] {
    return this.entries.filter((entry) => entry.level.toLowerCase() === level.toLowerCase());
  }

  /**
   * Get the most recent log entry
   */
  getLastEntry(): IBufferEntry | undefined {
    return this.entries[this.entries.length - 1];
  }

  /**
   * Get all log messages as strings
   */
  getMessages(): string[] {
    return this.entries.map((entry) => entry.message);
  }

  /**
   * Get all log messages joined as a single string
   */
  getAllText(): string {
    return this.entries.map((entry) => entry.message).join('\n');
  }

  /**
   * Check if any log message contains the specified text
   */
  contains(text: string): boolean {
    return this.entries.some((entry) => entry.message.includes(text));
  }

  /**
   * Check if any log message matches the specified regex
   */
  matches(pattern: RegExp): boolean {
    return this.entries.some((entry) => pattern.test(entry.message));
  }

  /**
   * Get the number of captured entries
   */
  getCount(): number {
    return this.entries.length;
  }

  /**
   * Clear all captured entries
   */
  override clear(): void {
    this.entries = [];
  }

  /**
   * Assert that the buffer contains a message with the specified text
   * @throws {Error} If no message contains the text
   */
  assertContains(text: string): void {
    if (!this.contains(text)) {
      const messages = this.getMessages();
      throw new Error(
        `Expected log to contain "${text}" but it was not found.\n` +
          `Captured messages:\n${messages.map((m) => `  - ${m}`).join('\n')}`,
      );
    }
  }

  /**
   * Assert that the buffer contains exactly the specified number of entries
   * @throws {Error} If the count doesn't match
   */
  assertCount(expectedCount: number): void {
    const actualCount = this.getCount();
    if (actualCount !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} log entries but found ${actualCount}.\n` +
          `Messages: ${this.getMessages().join(', ')}`,
      );
    }
  }

  /**
   * Assert that the buffer contains at least one message matching the pattern
   * @throws {Error} If no message matches
   */
  assertMatches(pattern: RegExp): void {
    if (!this.matches(pattern)) {
      const messages = this.getMessages();
      throw new Error(
        `Expected log to match pattern ${pattern} but no match was found.\n` +
          `Captured messages:\n${messages.map((m) => `  - ${m}`).join('\n')}`,
      );
    }
  }
}
