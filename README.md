# @epdoc/logger

A logging module supporting built-in and custom transports, webserver response middleware, rich message and data syntax
with color console output, chainable methods for recording log events, with the addition of a number of new methods,
many of which can be chained to create richer output with more columns of data.

## Versions

**Version 1000.0.0 indicates a major rewrite that is incompatible with prior versions of this module**

- Version prior to version 1000.0.0 (versions 2.x.x) were used in production, and were last updated at the end of 2016.
- Version 1000.0.0 is a TypeScript rewrite using Deno and is not backwards compatible with earlier versions. The main
  points for this new version are:
  - Chainable methods to allow for easy color formatting of log output when using the console
  - Maintains the Log Manager and transports concepts of the earlier version
  - Only a console and file transport have so far been written
  - Express and other middleware are not yet written, but should be easy for any user to create
  - Version 1000.0.0 is reliant on Deno std libraries for console color (I may change this dependency when I package
    this for general use)
  - substitutable log levels (e.g 'info','input','data' instead of 'info', 'verbose', 'debug')
  - customizable through class extension

# Install

```bash
deno add @epdoc/logger
```

# Documentation

- [Classes](/docs/classes.md)
- [Log Levels](/docs/log-levels.md)
- [Transports](/docs/transports.md)
- [Middleware](/docs/middleware.md)
- [Customization Overview](/docs/cutomization.md)

# Quick Start

## Log to the console

```typescript
import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console;
const logMgr = new Log.Mgr<M>();
logMgr.threshold = 'verbose';
logMgr.show = {
  level: true,
  timestamp: 'elapsed',
  package: true,
  reqId: true,
};
const log = logMgr.getLogger() as Log.std.Logger<M>;

log.info.text('Hello world').emit();

// Console output
0.002s [INFO   ] Hello world
```

```txt
0.002s [INFO   ] Hello world
```

Under the hood, the log manager is creating a single transport for outputting to the console, starting this transport,
then creating a logger object. Now the logger object can be called with `info`, `error`, `warn`, `debug`, `verbose`,
`spam` methods to create and return a new MsgBuilder. This is the same as:

```typescript
let line: Log.MsgBuilder.Console = log.info;
line.text('Hello world');
line.emit();
```

Calling `emit` will terminate the line and call the LogMgr to output the line to all transports. In this case there is
just the console transport. And in fact we currently only support the console and file transports.

## Adding Color to Console Output

The logger has various predefined color definitions for console output.

```typescript
log.info.h1('Output').value('my value').text('to').path('/Users/me/myfiles').emit();

// Output
0.034s [INFO   ] Output my value to /Users/me/myfiles
```

The `info` method above must be the first call. It returns an object that has the chainable methods h1, value, text, and
path. These methods are used to add color and other formatting to the output. Again,calling emit will result in the
output of the message to the console.

The `Console` message builder has many chainable methods for styling, including:

`count`, `text`, `h1`, `h2`, `h3`, `action`, `label`, `highlight`, `value`, `path`, `date`, `warn`, `error`,
`strikethru`

We will learn how to customize these styles later in this document. We will also learn how to create our own method
names with our own styles.

## Pluralization with `count`

The `count` method provides a convenient way to handle singular and plural nouns in your log messages. It takes a number
and applies pluralization logic to the _next_ chained method call.

### Simple Pluralization (adding 's')

If the next method has a single string, an 's' will be appended if the count is not 1.

```typescript
// Example: Singular
log.info.h2('We have').count(1).h2('message').text('in our inbox').emit();
// Output: We have 1 message in our inbox

// Example: Plural
log.info.h2('We have').count(5).h2('message').text('in our inbox').emit();
// Output: We have 5 messages in our inbox
```

### Custom Pluralization (singular/plural forms)

If the next method has two strings, the first is used for a singular count (1), and the second is used for a plural
count (any other number).

```typescript
// Example: Singular
log.info.h2('We have').count(1).h2('entry', 'entries').text('in our inbox').emit();
// Output: We have 1 entry in our inbox

// Example: Plural
log.info.h2('We have').count(0).h2('entry', 'entries').text('in our inbox').emit();
// Output: We have 0 entries in our inbox
```

## Controlling what is written to the console

A message consists of a date/time, log level and other fields that are joined together on the line with your actual
message. You can customize which of these fields is output. The example below shows the default settings.

```typescript
import { Log } from '@epdoc/logger';

const logMgr = new Log.Mgr();
const transportOpts = {
  filepath: '/my/filepath.log',
  show: {
    timestamp: 'elapsed', // can also be 'interval''utc' or 'local'
    level: true,
    reqId: false,
    sid: false,
    static: false,
    emitter: true,
    action: true,
    data: true,
  },
};
const transport = new Log.Transport.File(transportOpts);
logMgr.start();
log.info.h1('Hello world').emit();
```

Fields such as `reqId` and `sid` are used to identify the request and session when using an express or other backend
server.

~~The other fields `emitter`, `action`, `static` and data are also not likely to be needed for basic string output, so
these are set to false by default.~~

You can also specify what format your output is written to the console. You can specify that the output is a string,
JSON object, or array of JSON objects. ~~~You can further customize the output format by registering your own
formatters, but we won't cover this topic here.~~~

```ts
export const Format = {
  text: 'text',
  json: 'json',
  jsonArray: 'jsonArray',
} as const;
```

Notes:

- The timestamp value is of type `TimePrefix` which can be one of `elapsed`, `utc`, or `local`. TODO: support custom
  time formatters.
- Before `start` is called you have the opportunity to configure your transports. Oherwise a single console transport is
  created by default.

# Supporting @epdoc/logger in a module

If you have a library module in which you wish to support `@epdoc/logger`, and

- assuming you want to use the default logger configuration,
- you do not want to require the importer of your module to also use `@epdoc/logger`

You can attach the logger to a context, create logger object interfaces, then only call the logger when the context log
value is set. Here we create a `context.ts` file.

```ts
export type StyleArg = string | number | Record<string, unknown> | unknown[] | unknown;

interface IMB {
  text(...args: StyleArg[]): this;
  h2(...args: StyleArg[]): this;
  h3(...args: StyleArg[]): this;
  label(...args: StyleArg[]): this;
  value(...args: StyleArg[]): this;
  action(...args: StyleArg[]): this;
  warn(...args: StyleArg[]): this;
  error(...args: StyleArg[]): this;
  path(...args: StyleArg[]): this;
  err(error: unknown): this;
  data(data: unknown): this;
  emit(): void;
  ewt(duration: number): void;
}

export interface ILogger {
  get spam(): IMB;
  get trace(): IMB;
  get error(): IMB;
  get debug(): IMB;
  get warn(): IMB;
  get info(): IMB;
  get verbose(): IMB;
  set pkg(value: string);
  indent(): this;
  outdent(): this;
}

export interface ICtx {
  log: ILogger;
}
```

Then, if we want to use this in our main application, we can:

```ts
type M = Log.MsgBuilder.Console;
const logMgr = new Log.Mgr<M>();
logMgr.threshold = 'verbose';
logMgr.show = {
  level: true,
  timestamp: 'elapsed',
  package: true,
  reqId: true,
};
const ctx: ICtx = {
  log: logMgr.getLogger() as Log.std.Logger<M>,
};
```

Or, if we don't want to use this in our main application, pass in null for context.

# Why Another Logger?

I use logging extensively to

- trace proper executing of my code and also to
- enhance CLI applications with detailed output

None of the existing loggers that I could find supported the following requirements:

- easy colorization using chaninable methods
- ability to customize log levels to my own liking
- ability to extend existing classes with my own functionality (most modules default to making code private rather than
  protected)
- middleware to support backend server display of reqId, session ID so that log messaages could be filtered by request
  ID.
- custom transports:
  - at various points I have had transports for [Loggly](http://loggly.com) and SOS (a defunct desktop log display
    application)
  - external transports requires open and close support, or equivalent.
- JSON, JSON array and console text output all supported

## Action Items

- More unit tests
- Update SOS transport as a general HTTP transport and rename to 'http' transport (beware).

## Author

Jim Pravetz <jpravetz@epdoc.com>.

## License

[MIT](https://github.com/strongloop/express/blob/master/LICENSE)

```
# OUT OF DATE

### {@link Logger} Method Chaining

Most {@link Logger} methods support chaining.

The following methods all add column values to the message that is output but do not output the message:

- `action` - Sets the action column value to this string.
- `data` - Sets the data column value. Either pass in a key value pair, which is then added to the data object, or an
  object, which the data object is then set to.
- `set` - Sets a value in a `custom` column and keeps this value for the duration of the Log object's lifespan. This
  column is currently only output to the loggly transport.

The following methods result in a message being output with the corresponding log level set:

- `info`
- `warn`
- `debug`
- `verbose`
- `error`
- `fatal`

The following methods result in a message output with log level set to INFO:

- `separator` - Output a separator line containing # characters
- `date` - Outputs localtime, utctime and uptime
- `log` - Outputs level and string message, for example: `log.log( 'info', "Found %d lines", iLines )`.
  - `level` - Optional level (defaults to `info`)
  - `msg` - String to output, formatted with `util.format`
```

```
```
