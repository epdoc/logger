# packages/template TODO

## Feature: Progress Spinner

We are working on adding a new feature to this module. The new feature will show a progress spinner on an output line if, instead of calling ctx.log.info, we call ctx.progress.info.

The class `ProgressLine` has already been demonstrated to work.
We have added `ProgressMonitor` as part of architecting this solution, but we are not sure it is needed.
Mark all code in `monitor.ts` as trial and error code where we are conceptualizing a solution, without knowing the final design.

The expected use is something like this:

```ts
    const ctx = new Ctx.Context(pkg);
    ctx.progress.info.text('Downloading').label('fakefile.rsc').start();

    // Any other log messages between the start and stop will need to be below 'info' level
    // Ideally we would warn a user if they called ctx.log.info at this point, but this is not a requirement.
    await delayPromise(1000);

    ctx.progress.info.text('Downloaded').label('thefile.rsc').stop()
```

The feature has the following important characteristics:

- By calling `ctx.progress.info`, we are indicating that we want to show the spinner if the log threshold level is `info`. If the threshold level is above `info` (eg. `warn`) then we do not show the message or spinner. But if the threshold level is set below `info` (eg. `debug`, `verbose`, etc) then we DO NOT show the spinner, but Instead we show the log message as if the user had used `ctx.log.info`.
- `info` will return a `MsgBuilder` object (recommend `ProgressMsgBuilder` that extends `Console.Builder`) that has `start` and `stop` methods.
- There will be a progress `start` and a progress `stop`, and they will be linked to the same ProgressLine that gets displayed when the log threshold is `info`.
  - Calling `start` will create the `ProgressLine` with the spinner and the text that we were composing.
  - Calling stop will terminate the progress line and replace it with the new text that we composed and terminated with the `stop` method.
  - The user must NOT use any other `info` log messages between the `start` and `stop`.
- If `start` and `stop` are required to start and stop a ProgressLine, do we really need to call `ctx.progress` instead of `ctx.log`?
  - I think we will be able to use `ctx.log.info.text('Downloading').label('fakefile.rsc').start();` and rely on `start`, but this needs TBD.
- `start` and `stop` will `emit` the message if the threshold is below `info`. But they will control ProgressLine if they are at `info` level.

- We will also support calling `ctx.progress.verbose` and `ctx.progress.debug`, and the behaviour will be that we show no progress if the threshold level is above `verbose`/`debug`, the spinner if the level is at `verbose`/`debug`, and the log message if the level is below `verbose`/`debug`. However, for the purposes of clarity in our desriptions in this document, we are assuming the user is always using `info`.
