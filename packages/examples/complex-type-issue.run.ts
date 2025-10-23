#!/usr/bin/env -S deno run -A
import { CustomContext } from './lib/custom-context.ts';

if (import.meta.main) {
  const ctx = new CustomContext();

  ctx.log.info.myCustomMethod('This should work').emit();
}
