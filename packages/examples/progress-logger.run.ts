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
  console.log('\n=== Spinner at INFO level ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('info'); // Set threshold to INFO

  // Start with full builder chain
  // In a TTY, this shows an interactive spinner
  // In non-TTY or when redirected, it emits a log message
  ctx.log.info.text('Running').value('tasks').success('...').start({
    type: 'spinner',
    index: 0,
    color: 'cyan',
  });

  await delay(1000);

  // Update with new builder chain - same level required!
  ctx.log.info.text('Loading configuration...').update();

  await delay(1000);

  ctx.log.info.text('Connecting to server...').update();

  await delay(1000);

  ctx.log.info.text('Fetching data...').update();

  await delay(1000);

  // Complete with final builder chain
  ctx.log.info.icheck().label('task').text('All tasks completed!').complete();
}

async function exampleProgressBar() {
  console.log('\n=== Progress Bar at INFO level ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('info');

  const files = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'];

  // Start horizontal progress bar with builder chain
  ctx.log.info.text('Starting').start({
    type: 'horizontal',
    total: files.length,
    width: 30,
    color: 'green',
  });

  for (let i = 0; i < files.length; i++) {
    await delay(300); // Simulate work
    // Update with formatted message
    ctx.log.info.text(`Processing ${files[i]}...`).update(i + 1);
  }

  ctx.log.info.text(`Processed ${files.length} files successfully!`).complete();
}

async function exampleSuppressedMode() {
  console.log('\n=== SUPPRESSED Mode (level < threshold) ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('warn'); // Threshold is WARN

  // At INFO level (below threshold), progress is suppressed
  ctx.log.info.text('Starting task').start({ type: 'spinner', index: 0 });

  // isProgressActive should be false
  console.log(`Progress active: ${ctx.log.info.isProgressActive}`);
  console.log('This message is below the threshold, so no output is shown');
}

async function exampleEmitMode() {
  console.log('\n=== EMIT Mode (level > threshold) ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('debug'); // Threshold is DEBUG

  // At INFO level (above threshold), progress emits log messages
  ctx.log.info.text('Starting operation').start({ type: 'spinner', index: 0 });

  // isProgressActive should be false (emits as logs instead)
  console.log(`Progress active: ${ctx.log.info.isProgressActive}`);
  console.log('Above threshold - messages emitted as regular logs');

  // Subsequent updates also emit as logs
  ctx.log.info.text('Still working...').update();
  await delay(300);
  ctx.log.info.text('Almost done...').update();
  await delay(300);
  ctx.log.info.text('Finished!').complete();
}

async function exampleErrorHandling() {
  console.log('\n=== Error Handling with Progress ===\n');

  const ctx = new AppContext(pkg);
  await ctx.setupLogging('info');

  ctx.log.info.text('Starting').start({
    type: 'horizontal',
    total: 5,
    width: 20,
    color: 'yellow',
  });

  try {
    for (let i = 1; i <= 5; i++) {
      ctx.log.info.text(`Step ${i}/5`).update(i);
      await delay(200);

      if (i === 3) {
        throw new Error('Simulated error at step 3');
      }
    }
  } catch (_error) {
    // Cancel the progress and show error
    // Note: cancel() can be called from any level
    ctx.log.error.cancel();
    ctx.log.error.text('Operation failed!').emit();
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
  logger.info.text('Processing via LogMgr factory...').start({ 
    type: 'spinner', 
    index: 0, 
    color: 'magenta' 
  });

  await delay(1000);
  logger.info.text('Still processing...').update();
  await delay(1000);
  logger.info.text('Done via factory!').complete();
}

// Run all examples
if (import.meta.main) {
  console.log('=== @epdoc/logger Progress Integration Examples ===');
  console.log('These examples demonstrate progress indicators integrated with @epdoc/logger');
  console.log('Three modes: SUPPRESSED (level<threshold), PROGRESS (level==threshold), EMIT (level>threshold)');
  console.log('');

  await exampleSpinner();
  await delay(500);

  await exampleProgressBar();
  await delay(500);

  await exampleSuppressedMode();
  await delay(500);

  await exampleEmitMode();
  await delay(500);

  await exampleErrorHandling();
  await delay(500);

  await exampleWithLoggerFactory();

  console.log('\n=== All examples completed! ===\n');
}
