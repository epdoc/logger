import type * as Logger from '../logger/index.ts';
import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';

export const Format = {
  text: 'text',
  json: 'json',
  jsonArray: 'jsonArray',
} as const;
export type OutputFormat = keyof typeof Format;

export interface IBasic<M extends MsgBuilder.IBasic> {
  get type(): string;
  emit(msg: Log.Entry, logger: Logger.IEmitter): void;
  thresholdUpdated(): IBasic<M>;
  match(transport: IBasic<M>): boolean;
  open(callbacks: OpenCallbacks): Promise<void>;
  get ready(): boolean;
  close(): Promise<void>;
  clear(): void;
  destroy(): Promise<void>;
  get alive(): boolean;
  getOptions(): CreateOpts;
  toString(): string;
}

export type FCallback = () => void;
export type FError = (error: Error) => void;
export type OpenCallbacks = {
  onSuccess: FCallback;
  onError: FError;
  onClose: FCallback;
};

/**
 * @param [options.sid] {boolean} - If true then output express request and session IDs,
 *   otherwise do not output these values. Default is to use LogManager's sid setting.
 * @param [options.timestamp=ms] {string} - Set the format for timestamp output, must be one of
 *   'ms' or 'iso'.
 * @param [options.static=true] {boolean} - Set whether to output a 'static' column. By default
 *   this inherits the value from the LogManager.
 * @param [options.level=debug] {string} - Log level for this transport.
 */
export type CreateOpts = {
  sid?: boolean;
  timestamp?: Log.TimeOpt;
  static?: boolean;
  level?: string;
};

export type FactoryMethod<M extends MsgBuilder.IBasic> = (logMgr: LogMgr<M>) => IBasic<M>;

export type Entry = Partial<{
  level: string;
  timestamp: string;
  package: string;
  sid: string;
  reqId: string;
  msg: string;
  data: unknown;
}>;
