# Issues

Closed issued are marked with a checkbox.

- [x] Move display of duration (used in ewt) to Transport so that it can be put in a separate column.
- [ ] Add @epdoc/cliapp to this project.
- [ ] make sure that LogMgr controls thresholds globally, but that transports can override the log level. the log level should be allowed to be changed dynamically, and thereafter it would apply to newly created messages, not previously created log messages.
- [ ] Transports
  - [ ] make sure we can start using the logger right away, to log as much of the application startup process as possible. we would buffer messages until all initially configured transports are ready. 
  - [ ] can we dynamically add/remove transports? or dynamically enable/disable output to a transport?
  - [ ] the logdy transport should detect if logdy server is not running and, if it is not, then either buffer messages (up to a max number) or throw messages away. this should be a configuration of the logdy transport (buffer size, with default 100, and whether to buffer)
  - [ ] Create a mock transport for testing
  - [ ] transports should tell MsgBuilder whether to output in color (eg. file transport does not want the escape characters that are used in a terminal)
  - [ ] transports should build pkg array from the logger and it's parents, using the pkg separator that the user defines (or defaults to)
- [ ] Create a top level [README.md](../../README.md) that says what the project contains.
- [ ] Create or update README.md files in each package. These will be seen by users of the package and should tell the user what the package contains, then, if relevant, reference documentation in the top level docs folder.
  - [ ] [msgbuilder](../../packages/msgbuilder/README.md)
  - [ ] [loglevels](../../packages/loglevels/README.md)
  - [ ] [logger](../../packages/logger/README.md)
  - [ ] [examples](../../packages/examples/README.md)
  - [ ] [logdy](../../packages/logdy/README.md)
