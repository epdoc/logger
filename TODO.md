# TODO

We are in the middle of an effort to hopefully simplify logic in packages/logger. 
There is a new packages/msgbuilder/AI.md that helps you understand this module.
packages/loglevels has a library-metadata.json file and the code base is small.

There are two ways that we are simplifying the logic:

1. We now convert to and pass a `Spec` object (from packages/loglevels) when comparing log levels. packages/loglevels now consistently uses OTLP severity levels, and so comparing log levels no longer requires that we call the loglevels package.

2. We would like to carry more state in the Emitter object that is passed to our new MsgBuilder objects. This state will allow the emit methods to more directly handle message emit actions.

## LogLevels:

Loglevel thresholds are set at the logMgr, logger and transport level. Usually these all have the same value (defaults to loglevel.defaultLevel). LogMgr's log level threshold is what we set on new root loggers by default. Individual loggers can have their values set to different values, either higher or lower. They must have a threshold set (ie. if a logger threshold is not set then it is an error to throw). Transports can have their thresholds set differently too (eg. a file transport could be set to info while a console could be set to verbose). The transports, when created, have their thresholds set to the logMgr threshold. These values can be later changed. It is an error if a transport does not have it's threshold set. 

**Task**: Implement this fix:
- Logger's should not have their own threshold setting.  
- LogMgr's threshold is the default for newly created transports.
- Setting LogMgr's threshold should be used to update the threshold value on all transports (value is rippled out)
- Transports can thereafter have their transport thresholds set

A message will need to be composed if it's level is equal to or greater than any of the transports' thresholds. This can save some code execution time. Then it is up to the transport if the message is actually emitted.

When we create a MsgBuilder and pass it an Emitter object, the Emitter tells the msgBuilder whether the message will be emitted or not. This is done with the `enable` property. We evaluate the enable property when a new Emitter is created. 

**Task**: Rename 'enable' to a better name, possibly 'willEmit',  'meetsAnyTransportThreshold'.

**Task**: Cleanup comparison of levels against thresholds so that we only use the transports

There is also a flush threshold, which is loglevels.flushLevel. If a message being emitted is above this level then the transport should flush it's output lines (eg. to a file). This comparison can now be moved o




## Finish migrating code to use loglevel `Spec` object instead of severity or name

Previously we were using either the log level name or severity and having to ask packages/loglevel to 

The purpose of meetsAnyThreshold in packages/logger/src/loggers/base/logger.ts is to 