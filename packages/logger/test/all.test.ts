import { assert } from '@std/assert';
import * as mod from '../mod.ts';

Deno.test('all modules can be imported', () => {
  assert(mod);
});
