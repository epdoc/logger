/**
 * Progress integration examples
 *
 * Run: deno run -A packages/examples/progress.run.ts
 *
 * Demonstrates how to use @epdoc/progress with @epdoc/logger for showing
 * progress indicators in CLI applications.
 */
import * as Progress from '@epdoc/progress';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function exampleSpinner() {
  console.log('\n=== Spinner Example ===\n');

  const progress = new Progress.Line({ type: 'spinner', index: 0, color: 'cyan' });
  progress.start('Connecting to server...');

  await delay(800);
  progress.update('Authenticating...');

  await delay(600);
  progress.update('Loading data...');

  await delay(1000);
  progress.stop('Connected successfully!');
}

async function exampleProgressBar() {
  console.log('\n=== Progress Bar Example ===\n');

  const files = ['document.pdf', 'image.png', 'data.csv', 'archive.zip', 'readme.md'];
  const progress = new Progress.Line({
    type: 'horizontal',
    total: files.length,
    width: 30,
    color: 'green',
  });

  progress.start('Processing files...');

  for (let i = 0; i < files.length; i++) {
    await delay(400); // Simulate file processing
    progress.update(`Processing ${files[i]}...`, i + 1);
  }

  progress.stop(`Processed ${files.length} files!`);
}

async function exampleBounce() {
  console.log('\n=== Bounce Animation Example ===\n');

  const progress = new Progress.Line({ type: 'bounce', index: 0, color: 'magenta' });
  progress.start('Thinking...');

  await delay(1500);
  progress.update('Still thinking...');

  await delay(1500);
  progress.stop('Done thinking!');
}

async function exampleVerticalFill() {
  console.log('\n=== Vertical Fill Example ===\n');

  const progress = new Progress.Line({ type: 'vertical', total: 10, color: 'yellow' });
  progress.start('Battery charging...');

  for (let i = 0; i <= 10; i++) {
    await delay(200);
    progress.update(`Charge level: ${i * 10}%`, i);
  }

  progress.stop('Fully charged!');
}

// Run all examples
if (import.meta.main) {
  console.log('Running @epdoc/progress examples...');
  console.log('These examples demonstrate standalone ProgressLine usage.');
  console.log('For integration with @epdoc/logger, see packages/cliapp/test/progress-modes.test.ts');

  await exampleSpinner();
  await delay(300);

  await exampleProgressBar();
  await delay(300);

  await exampleBounce();
  await delay(300);

  await exampleVerticalFill();

  console.log('\n=== All examples completed! ===\n');
}
