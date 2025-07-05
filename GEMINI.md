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

## Code Generation

Do not use the TypeScript type 'any'. Instead use 'unknown'.

Don't use switch statements.

Use the type guards and tests and other utility functions provided in `@epdoc/type` where possible. Examples:

- instead of using `var instanceof Date`, use `isDate(var)`.
- instead of using `typeof var === 'string'`, use `isString(var)`.

Automatically fix `type` keyword usage in `import` statements in typescript `.ts` files:

- When an import statement only imports types, add a `type` keyword to the item being imported.
- If all items being imported from a file are only to import types, put the `type` keyword before the list of items. For
  example, `import type * as c from '../types/conditions.ts'` should include the keyword `type` where appropriate.
  Otherwise we get the error "All import identifiers are used in types

## Commit Messages

When generating commit messages, only use the word 'refactor' when a significant change has been made to how code is
organized or a class is implemented. Instead use the word 'modified' when changes are made.

## Code Explanations

### Logger getChild method

We have a logger getChild method to allow loggers to nest under a root logger. This allows customization of the `sid`,
`reqId` and `pkg` properties of a logger. So if we receive, for example, an HTTP request for a particular user, we can
set the logger's `sid` property to that user's session ID. And we can set a unique `reqId` per HTTP request, either
deriving the `reqId` from the request itself, or simply generating a unique number for the `reqId` (we just increment a
value starting at 0 or 1 for the `reqId`).

The `pkg` property is to allow a code library/package/class to set a property that might be unique to that library or
file, etc.. This is more often used in the case where you want each library/package or class to identify itself for
logging. So this is a seperate use case.

Another use case is if we are processing a list of email messages. It is possible to set the `reqId` to the unique ID of
the message. Now when the `reqId`, `sid` or `pkg` are output in log messages, we can keep better track of which log
message corresponds to which operation.

We have implemented `reqId` and `pkg` as arrays to allow for the possibility of nesting either of these properties. For
example if a file 'doit.ts' then calls functions in 'more.ts', we could have `pkg` display 'doit.more' to show the code
hierarchy.

In the case of `reqId` it is more likely we will have just one unique `reqId` to display, unless a request results in
branch logic to perform subtasks.
