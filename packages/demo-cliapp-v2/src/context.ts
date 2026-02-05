/**
 * @file Application Context for demo-cliapp-v2
 */

import { Context } from '@epdoc/cliapp';

export class AppContext extends Context {
  isApp = true;
  name?: string;
  debugMode = false;
}

export class ChildContext extends AppContext {
  isChild = true;
}

// export const ctx = new AppContext(pkg as unknown as CliffApp.DenoPkg, { pkg: 'app' });
// await ctx.setupLogging();
