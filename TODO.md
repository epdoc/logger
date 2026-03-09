# TODO

We are in the middle of an effort to hopefully simplify logic in packages/logger. 
There is a new packages/msgbuilder/AI.md that helps you understand packages/msgbuilder.
packages/loglevels has a library-metadata.json file and the code base is small.

There are two ways that we have simplified the logic:

1. We now convert to, and pass a, `Spec` object (from packages/loglevels) when comparing log levels. packages/loglevels now consistently uses OTLP severity levels, and so comparing log levels no longer requires that we call the loglevels package: we can do it directly.

2. We would like to, and haved moved towards, carrying more state in the Emitter object that is passed to our new MsgBuilder objects. This state will allow the emit methods to more directly handle message emit actions.


## LogLevels:

### Explanation of how it Was

Loglevel thresholds were set at the logMgr, logger and transport level. Usually these all have the same value (defaults to loglevel.defaultLevel). LogMgr's log level threshold is what we previously set on new root loggers by default. Individual loggers could have their values set to different values, either higher or lower.  Transports can have their thresholds set differently too (eg. a file transport could be set to info while a console could be set to verbose). The transports, when created, have their thresholds set to the logMgr threshold. These values can be later changed. It is an error if a transport does not have it's threshold set. 

### Explanation of How it is now

The Transport determines the log level threshold and whether a message is output. We no longer have per-logger log level thresholds. When we set the logMgr's threshold, this sets all transports to that threshold. Thereafter we can modify the threshold of individual tranports.

**Summary**: You are to verify the following:
- Logger's should not have their own threshold setting.  
- LogMgr's threshold is the default for newly created transports.
- Setting LogMgr's threshold should be used to update the threshold value on all transports (value is rippled out)
- Transports can thereafter have their transport thresholds set

A message will need to be "composed" if it's level is equal to or greater than any of the transports' thresholds. This can save some code execution time, because we will not compose the message if, for example, the threshold is set to info, and the log message is verbose. THereafter it is up to the transport if the message is actually emitted.


There is also a flush threshold, which is loglevels.flushLevel. If a message being emitted is above this level then the transport should flush it's output lines (eg. to a file). This comparison has been moved to the transportMgr, which then sets a flush flag that the transport itself uses to determine if a flush will occur.

## Extra flags that we need to resolve the use of

There are other flags for whether data and emit are enabled. Emit might be disabled on a transport by a user, while still keeping the transport alive. Data is the Dict of data that can be output along with a message, which is raw data in the TranportEntry that could be output in different formats depending on the transport.

We are a bit confused about the placement and processing of the data and emit enable flags and how they should be set. Your help on this would be appreciated. Does the data flag overlap with EmitterShowOpts and therefore has no value? I honestly cannot remember .

## Our task for packages/logger are:
- Do a thorough review of the code in `src`. Review and propose any changes that are needed for the current code under packages/logger/src.
- Take note of the above explanations and any hints of items that need more research or to be verified.
- We will not work on functional testing or unit tests until this review is done and we have manually verified some of the code.
- In packages/logger, for now I recommend reading only the source code that is in the src folder, because otherwise you might conflate "what was" with "what is".
- as part of your review, generate an AI.md file or equivalent that will summarize what you have learnt, allowing easier consumption upon our next step, without you having to reread the entire source code again.


