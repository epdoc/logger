/**
 * Progress integration examples with @epdoc/logger
 *
 * Run: deno run -A packages/examples/progress-logger.run.ts
 *
 * Demonstrates how to use @epdoc/cliapp's ProgressMsgBuilder with @epdoc/logger
 * for showing progress indicators that adapt to log levels.
 */
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Custom context with progress support
class AppContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

const pkg = { name: 'progress-demo', version: '1.0.0', description: 'Progress demo' };

async function exampleSpinner() {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging('info'); // Set threshold to INFO

  ctx.log.info.section('Spinner at INFO level').emit();

  // At INFO level (matches threshold), shows interactive spinner
  const progress = ctx.log.info.text('Running').value('tasks').success('...').start({
    type: 'spinner',
    index: 0,
    color: 'cyan',
  });

  if (progress) {
    await delay(2000);
    progress.update('Loading configuration...');

    await delay(1000);
    progress.update('Connecting to server...');

    await delay(1000);
    progress.update('Fetching data...');

    await delay(1000);
    ctx.log.info.icheck().label('task').complete('All tasks completed!');
  } else {
    // In EMIT mode (level > threshold), start() emits a log message
    ctx.log.info.text('Progress not shown - emitted as log message instead').emit();
  }
}

async function exampleProgressBar() {
  console.log('\n=== Progress Bar at INFO level ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('info');

  const files = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'];

  // Start horizontal progress bar
  const progress = ctx.log.info.start({
    type: 'horizontal',
    total: files.length,
    width: 30,
    color: 'green',
  });

  if (progress) {
    for (let i = 0; i < files.length; i++) {
      await delay(300); // Simulate work
      progress.update(`Processing ${files[i]}...`, i + 1);
    }

    ctx.log.info.complete(`Processed ${files.length} files successfully!`);
  }
}

async function exampleSuppressedMode() {
  console.log('\n=== SUPPRESSED Mode (level < threshold) ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('warn'); // Threshold is WARN

  // At INFO level (below threshold), progress is suppressed
  const progress = ctx.log.info.start({ type: 'spinner', index: 0 });

  // Returns null - nothing is shown
  console.log(`Progress started: ${progress}`);
  console.log('This message is below the threshold, so no output is shown');
}

async function exampleEmitMode() {
  console.log('\n=== EMIT Mode (level > threshold) ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('debug'); // Threshold is DEBUG

  // At INFO level (above threshold), progress emits log messages
  const progress = ctx.log.info.start({ type: 'spinner', index: 0 });

  // Returns null - instead a log message was emitted
  console.log(`Progress returned: ${progress}`);
  console.log('Above threshold - message emitted as regular log');

  // Subsequent updates also emit as logs
  ctx.log.info.update('Still working...');
  await delay(300);
  ctx.log.info.update('Almost done...');
  await delay(300);
  ctx.log.info.complete('Finished!');
}

async function exampleErrorHandling() {
  console.log('\n=== Error Handling with Progress ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('info');

  const progress = ctx.log.info.start({
    type: 'horizontal',
    total: 5,
    width: 20,
    color: 'yellow',
  });

  if (progress) {
    try {
      for (let i = 1; i <= 5; i++) {
        progress.update(`Step ${i}/5`, i);
        await delay(200);

        if (i === 3) {
          throw new Error('Simulated error at step 3');
        }
      }
    } catch (_error) {
      // Cancel the progress and show error
      ctx.log.error.cancel();
      ctx.log.error.text('Operation failed!').emit();
    }
  }
}

async function exampleWithLoggerFactory() {
  console.log('\n=== Using LogMgr Factory Pattern ===\n');

  // Create LogMgr with custom MsgBuilder factory
  const logMgr = new Log.Mgr<CliApp.Progress.MsgBuilder>();

  // Set up the factory to create ProgressMsgBuilder instances
  logMgr.msgBuilderFactory = (emitter) => new CliApp.Progress.MsgBuilder(emitter);

  // Create logger
  const logger = await logMgr.getLogger<Log.Std.Logger<CliApp.Progress.MsgBuilder>>();

  // Now logger uses ProgressMsgBuilder for all messages
  const progress = logger.info.start({ type: 'spinner', index: 0, color: 'magenta' });

  if (progress) {
    progress.update('Processing via LogMgr factory...');
    await delay(1000);
    logger.info.complete('Done via factory!');
  }
}

// Run all examples
if (import.meta.main) {
  console.log('=== @epdoc/logger Progress Integration Examples ===');
  console.log('These examples demonstrate progress indicators integrated with @epdoc/logger');
  console.log('Three modes: SUPPRESSED (level<threshold), PROGRESS (level==threshold), EMIT (level>threshold)');
  console.log('');

  await exampleSpinner();
  await delay(500);

  // await exampleProgressBar();
  // await delay(500);

  // await exampleSuppressedMode();
  // await delay(500);

  // await exampleEmitMode();
  // await delay(500);

  // await exampleErrorHandling();
  // await delay(500);

  // await exampleWithLoggerFactory();

  console.log('\n=== All examples completed! ===\n');
}
