import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import * as CliApp from '../cliapp/src/mod.ts';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

class Context extends CliApp.Ctx.AbstractBase<M, L> {}

const errFn = async (silent: boolean, path?: string): Promise<void> => {
  if (error) {
    const err = new Error(`${silent ? 'Silent' : 'Noisy'} Error${filePath ? ' with path' : ''}`);
    // @ts-ignore silent is allowed
    err.silent = silent;
    // @ts-ignore path is allowed
    err.path = path;
    throw err;
  }
  await Promise.resolve();
};

// Parse command line arguments
const args = Deno.args;
let silent = false;
let error = false;
let filePath: string | undefined;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--silent') {
    silent = true;
    error = true;
  } else if (arg === '--error') {
    error = true;
  } else if (!arg.startsWith('--')) {
    // Assume it's the file path argument
    filePath = arg;
    break;
  }
}

const pkg = { name: 'run-test', version: '1.2.3', description: 'test' };

const ctx = new Context(pkg);
await ctx.setupLogging({ pkg: 'run-test' });

// Store file path in context if needed, or handle as required
if (filePath) {
  // You can use the filePath here as needed
  console.log(`File path argument: ${filePath}`);
}

await CliApp.run(ctx, () => errFn(silent, filePath));
