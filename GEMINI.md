# Gemini Instructions

## References

- [README](./README.md)
- [AI Assist Instructions](./.github/copilot-instructions.md)
- [Classes](./docs/classes.md)
- [Configuration](./docs/configuration.md)
- [Customization](./docs/cutomization.md)
- [Express](./docs/express.md)
- [Log Levels](./docs/log-levels.md)
- [Log Manager](./docs/logmgr.md)
- [Middleware](./docs/middleware.md)
- [Oak](./docs/oak.md)
- [Transports](./docs/transports.md)

## Additional Coding Instructions

- Do not use namespaces.

### Code Organization

Under [src](./src) we have the following modules hierachy. Each mod.ts exports what is within the module. 

```bash
├── levels/mod.ts
│   └── mod.ts
├── loggers/mod.ts
│   ├── base/mod.ts
│   ├── indent/mod.ts
│   ├── cli/mod.ts
│   └── std/mod.ts
├── message/mod.ts
│   ├── base/mod.ts
│   └── console/mod.ts
├── transports/mod.ts
│   ├── base/mod.ts
│   ├── console/mod.ts
│   └── file/mod.ts
└── mod.ts
```

Modules have been organized such that each module has
- `mod.ts` - defines exports
- `types.ts` - defines all types that are to be exported
- `consts.ts`, `helpers.ts`, `utils.ts` - for non-type definition code
- `my-class-file.ts` - for class definitions and nothing else

### Rules for import statements
When referenced outside of the modules listed here, the referrer must import from the `mod.ts` file of the other module. The following examples illustrate the desired behaviour.

#### Examples

Anywhere within a first-level module must import other first-level modules by importing from the `mod.ts` file.
```ts
// Anywhere within ./src/transports
import type * as MsgBuilder from '../.message/mod.ts';
import type * as Levels from '../levels/mod.ts';
```

Anywhere from within a second-level module that is importing another second-level under the same first-level module, must do the same. For example, from [./src/message](./src/message), other modules within the message module (eg. `console`) must use
```ts
import type * as Base from '../base/mod.ts'
```

When referencing code from within the same first or lower level module:

```ts
// Imports from types.ts files may be grouped
import type * as MsgBuilder from '../types.ts'
// or imported individually, depending on preference
import type { StyleFormatterFn, StyleArg } from '../types.ts'
```

Other files must use individual imported items. For example, from within [./src/message/console/builder.ts](./src/message/console/builder.ts), we use:
```ts
// From within ./src/message/console/builder.ts
import { consoleStyleFormatters } from './const.ts';
```

Any code in a module that refers to top level code under [./src](./src) should follow these examples:
```ts
// To import type definitions from './src/types.ts
import type * as Log from '../types.ts'

// To import the LogMgr
import { LogMgr } from '../logmgr.ts'
```

### Logger getChild method

We have a logger getChild method to allow loggers to nest under a root logger. This allows customization of the `sid`,
`reqId` and `pkg` properties of a logger. So if we receive, for example, an HTTP request for a particular user, we can
set the logger's `sid` property to that user's session ID. And we can set a unique `reqId` per HTTP request, either
deriving the `reqId` from the request itself, or simply generating a unique number for the `reqId` (we just increment a
value starting at 0 or 1 for the `reqId`).

The `pkg` property is to allow a code library/package/class to set a property that might be unique to that library or
file, etc.. This is more often used in the case where you want each library/package or class to identify itself for
logging.

Another use case is if we are processing a list of email messages. It is possible to set the `reqId` to the unique ID of
the message. Now when the `reqId`, `sid` or `pkg` are output in log messages, we can keep better track of which log
message corresponds to which operation.

We have implemented `reqId` and `pkg` as arrays to allow for the possibility of nesting either of these properties. For
example if a file 'doit.ts' then calls functions in 'more.ts', we could have `pkg` display 'doit.more' to show the code
hierarchy.

In the case of `reqId` it is more likely we will have just one unique `reqId` to display, unless a request results in
branch logic to perform subtasks.
