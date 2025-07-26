import type { EmitterShowOpts } from '../../types.ts';

/**
 * Defines the common configuration options for any transport.
 */
export interface BaseOptions {
  /**
   * Overrides the default visibility settings for log metadata.
   * @see {@link Log.EmitterShowOpts}
   */
  show?: EmitterShowOpts;
}

// /**
//  * Defines a set of callbacks for monitoring the transport's lifecycle.
//  */
// export type OpenCallbacks = {
//   /** Called when the transport successfully opens. */
//   onSuccess: FCallback;
//   /** Called when an error occurs. */
//   onError: FError;
//   /** Called when the transport closes. */
//   onClose: FCallback;
// };

// /** A generic callback function with no arguments. */
// export type FCallback = () => void;
// /** A callback function for handling errors. */
// export type FError = (error: Error) => void;

// /**
//  * Defines the creation options for a transport.
//  */
// export type CreateOpts = {
//   /**
//    * Controls the display of the session ID.
//    * If not set, the `LogMgr`'s setting is used.
//    */
//   sid?: boolean;
//   /**
//    * Specifies the format for timestamps.
//    * If not set, the `LogMgr`'s setting is used.
//    */
//   timestamp?: TimestampFormatType;
//   /**
//    * @deprecated This option is no longer used.
//    */
//   static?: boolean;
//   /**
//    * The log level threshold for this transport.
//    */
//   level?: string;
// };
