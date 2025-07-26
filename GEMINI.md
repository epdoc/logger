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
