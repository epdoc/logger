// Test to understand Commander.js parent/child action execution order
import { Command } from 'commander';

const program = new Command();

program
  .name('test')
  .option('--parent-opt <value>', 'Parent option')
  .action((opts) => {
    console.log('PARENT ACTION CALLED');
    console.log('Parent opts:', opts);
  });

const child = new Command('child');
child
  .option('--child-opt <value>', 'Child option')
  .action((opts) => {
    console.log('CHILD ACTION CALLED');
    console.log('Child opts:', opts);
    console.log('Parent opts from child:', program.opts());
  });

program.addCommand(child);

// Test 1: Just parent
console.log('\n=== Test 1: Just parent ===');
await program.parseAsync(['node', 'test', '--parent-opt', 'parent-value']);

// Test 2: Parent + child
console.log('\n=== Test 2: Parent + child ===');
const program2 = new Command();
program2
  .name('test')
  .option('--parent-opt <value>', 'Parent option')
  .action((opts) => {
    console.log('PARENT ACTION CALLED');
    console.log('Parent opts:', opts);
  });

const child2 = new Command('child');
child2
  .option('--child-opt <value>', 'Child option')
  .action((opts) => {
    console.log('CHILD ACTION CALLED');
    console.log('Child opts:', opts);
    console.log('Parent opts from child:', program2.opts());
  });

program2.addCommand(child2);

await program2.parseAsync(['node', 'test', '--parent-opt', 'parent-value', 'child', '--child-opt', 'child-value']);
