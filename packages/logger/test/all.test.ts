import { assert } from '@std/assert';
import * as mod from '../src/mod.ts';

Deno.test('all modules can be imported', () => {
  assert(mod);
});
