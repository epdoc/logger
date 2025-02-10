# @epdoc/logger

**NOTE: Version 1000.0.0 indicates a major rewrite that is incompatible with prior versions of this module**

A logging module supporting built-in and custom transports, webserver response middleware, rich message and data syntax,
chainable methods for recording log events, with the addition of a number of new methods, many of which can be chained
to create richer output with more columns of data.

## Versions

- Version prior to version 1000.0.0 (versions 2.x.x)were used in production, and were last updated at the end of 2016.
- Version 1000.0.0 is a TypeScript rewrite using Deno and is not backwards compatible with earlier versions. The main
  points for this new version are:
  - Chainable methods to allow for easy color formatting of log output when using the console
  - Maintains the Log Manager and transports concepts of the earlier version
  - Only a console transport has so far been written
  - Express and other middleware are not yet written, but should be easy for any user to create
  - Version 1000.0.0 is reliant on Deno std libraries for console color (I may change this dependency when I package
    this for general use)
  - substitutable log levels
  - customizable through class extension

[This page and API Reference are also formatted and available here](http://jpravetz.github.io/epdoc-logger/out/index.html).

# Install

```bash
deno add @epdoc/logger
```

# Quick Start

## Log to the console

```typescript
import { Log } from '../mod.ts';

const showOpts: Log.EmitterShowOpts = {
  level: true,
  timestamp: 'elapsed',
  reqId: true,
  package: true,
};

const logMgr = new Log.Mgr().setShow(showOpts);
const log = logMgr.getLogger('std') as Log.std.Logger;
logMgr.setThreshold('verbose');

log.info.text('Hello world').emit();

// Console output
0.002s [INFO   ] Hello world
```

```txt
0.002s [INFO   ] Hello world
```

Under the hood, the log manager is creating a single transport for outputting to
the console, starting this transport, then creating a logger object. Now the
logger object can be called with `info`, `error`, `warn`, `debug`, `verbose`,
`spam` methods to create and return a new MsgBuilder. This is the same as:

```typescript
let line: Log.MsgBuilder.Console = log.info;
line.text('Hello world');
line.emit();
```

Calling `emit` will terminate the line and call the LogMgr to output the line to
all transports. In this case there is just the console transport. And in fact we
currently only support the console transport.

## Adding Color to Console Output

The logger has various predefined color definitions for console output.

```typescript
log.info.h1('Output').value('my value').text('to').path('/Users/me/myfiles').emit();

// Output
0.034s [INFO   ] Output my value to /Users/me/myfiles
```

The `info` method above must be the first call. It returns an object that has
the chainable methods h1, value, text, and path. These methods are used to add
color and other formatting to the output. Again,calling emit will result in the
output of the message to the console.

The complete list of chainable methods is in [Log.MsgBuilder.Console.styleFormatters](./src/message/console.ts):

`text`, `h1`, `h2`, `h3`, `action`, `label`, `highlight`, `value`, `path`, `date`, `warn`, `error`, `strikethru`,

We will learn how to customize these styles later in this document. We will also
learn how to create our own method names with our own styles.

## Controlling what is written to the console

############# OUT OF DATE #################

A message consists of a date/time, log level and other fields that are joined
together on the line with your actual message. You can customize which of these
fields is output. The example below shows the default settings.

```typescript
import { LogManager } from '@epdoc/logger';
import { style } from './styles/default';

const logMgr: LogManager = new LogManager();
logMgr.addTransport({
  name: 'console',
  type: 'string',
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
  style: style,
});

logMgr.start();
log.info('Hello world').emit();
```

Fields such as `reqId` and `sid` are used to identify the request and session when using an express or koa server. The
other fields `emitter`, `action`, `static` and data are also not likely to be needed for basic string output, so these
are set to false by default.

You can also specify what format your output is written to the console. You can specify that the output is a string,
JSON object, or array of JSON objects. You can further customize the output format by registering your own formatters,
but we won't cover this topic here. Instead you will have to delve into the `TransportFormatterFactoryMethod` to learn
how.

Notes:

- The timestamp value is of type `TimePrefix` which can be one of `elapsed`, `interval`, `utc`, or `local`. TODO:
  support custom time formatters.
- The type value is of type `FormatterType` which can be one of `string`, `json`, `json-array`, or a custom transport
  name.
- Before `start` is called you have the opportunity to configure your transports. Oherwise a single console transport is
  created by default.

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

## Action Items

- More unit tests
- Document and add unit tests for {@link LogListener}, an object that makes it easier to use log the callback transport
  in unit tests.
- Update SOS transport as a general HTTP transport and rename to 'http' transport (beware).

## Author

Jim Pravetz <jpravetz@epdoc.com> Includes console colorize code from [Winston](https://github.com/winstonjs/winston).

## License

[MIT](https://github.com/strongloop/express/blob/master/LICENSE)
