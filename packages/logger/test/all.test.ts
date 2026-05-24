import * as assert from 'node:assert';
import * as mod from '../src/mod.ts';

Deno.test('all modules can be imported', () => {
  assert.ok(mod);
});
