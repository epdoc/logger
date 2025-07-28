import * as mod from '../mod.ts';
import { assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.test('all modules can be imported', () => {
  assert(mod);
});
