import { CustomContext } from './lib/custom-context.ts';

const ctx = new CustomContext();

ctx.log.info.myCustomMethod('This should work').emit();
