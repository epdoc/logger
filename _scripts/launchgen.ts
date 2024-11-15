import { walk } from 'jsr:@std/fs/walk';
import path from 'node:path';
import pkg from '../deno.json' with { type: 'json' };

const template = {
  request: 'launch',
  name: 'Debug tests',
  type: 'node',
  cwd: '${workspaceFolder}',
  env: {},
  runtimeExecutable: '/Users/jpravetz/.deno/bin/deno',
  runtimeArgs: [
    'test',
    '--inspect-brk',
    '--allow-env',
    '--allow-sys',
    '--allow-read',
    '--allow-write',
    './test/fs.test.ts',
  ],
  attachSimplePort: 9229,
};

const pwd: string = import.meta.dirname as string;
const launchfile = path.resolve(pwd, '..', '.vscode', 'launch.json');

const result = { version: '0.2.0', configurations: [] };

const addTest = (entry: Deno.DirEntry, name: string) => {
  if (entry.isFile && entry.name.endsWith('test.ts')) {
    console.log(name);
    const item = Object.assign({}, template, { name: `Debug ${name}` });
    item.runtimeArgs = [];
    template.runtimeArgs.forEach((arg) => {
      item.runtimeArgs.push(arg);
    });
    item.runtimeArgs[item.runtimeArgs.length - 1] = `./${name}`;
    result.configurations.push(item as never);
  }
};

if (Array.isArray(pkg.workspace)) {
  await Promise.all(
    pkg.workspace.map(async (scope) => {
      for await (const entry of walk(path.resolve(pwd, '..', scope), { match: [/test\.ts$/] })) {
        const name = `${scope}/${entry.name}`;
        addTest(entry, name);
      }
    })
  );
} else {
  for await (const entry of Deno.readDir(path.resolve(pwd, '..'))) {
    addTest(entry, entry.name);
  }
}

Deno.writeTextFileSync(launchfile, JSON.stringify(result, null, 2));
