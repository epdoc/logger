# Customization

This section is a high level overview of how you can customize your use of the
@epdoc/logger. It's contents overlap somewhat with the content that can be found
under the various [other sections](/README.md#documentation) of this document.

## Log Levels

#epdoc/logger comes out of the box with two sets of log levels. Refer to [Log
Levels](./log-levels.md) for how to select which set to use, or to further
[customize](./log-levels.md#customization) with your own set of log levels.

## Message Formating

A message is a Record (Entry) and a string (Entry.msg).

```ts
export type Entry = {
  level: Level.Name;
  timestamp?: Date;
  sid?: string;
  reqId?: string;
  package?: string;
  // msg?: string;
  msg: string | MsgBuilder.IFormat | undefined;
  data?: Record<string, unknown>;
};
```

You can customize which fields are output when outputting a log message. These
`show` options can be set at the [LogMgr](./logmgr.md) or
[Transport](./transports.md) level. Transport output can be further customized
by indicating whether the output is color/no-color, text, JSON or an array of
JSON objects.

```ts
export type EmitterShowOpts = {
  level?: boolean;
  timestamp?: 'utc' | 'local' | 'elapsed';
  sid?: boolean;
  reqId?: boolean;
  package?: boolean;
  data?: boolean;
};
```

```ts
logMgr.show({level:true,timestamp:'elapsed'});
```

The `msg` fields is always output. It is customized and built on a per-transport basis.

## Transports

Console and File transports are supported out of the box. Refer to
[Transports](./transports.md) for information on how to select a transport or to
write your own custom transport.

```ts
const transport = new ConsoleTransport({ color: true, format: 'text', show: { level: true, timestamp: true }})
```

## Custom Implementations

The following can be further customized with your own implementations.

- [Log levels](./log-levels.md#customization)
- MsgBuilders
- Transports
