#!/usr/bin/env -S deno run -A
/**
 * Wrapper Pattern Example
 * 
 * Demonstrates how to create project-specific wrappers that hide generic complexity
 * and prevent mistakes when using the logger throughout a codebase.
 */

import * as Log from '$logger';
import type * as MsgBuilder from '$msgbuilder';

// Define the types we want to use throughout our project
type M = MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

/**
 * Project-specific LogMgr wrapper that hides generic complexity
 */
class ProjectLogMgr extends Log.Mgr<M> {
  /**
   * Get a logger with predefined types - no generics needed by callers
   */
  getLogger(params?: Log.IGetChildParams): L {
    return super.getLogger<L>(params);
  }
}

/**
 * Alternative: Factory functions approach
 */
export function createLogMgr() {
  return new Log.Mgr<M>();
}

export function getProjectLogger(mgr: Log.Mgr<M>, params?: Log.IGetChildParams): L {
  return mgr.getLogger<L>(params);
}

// Example usage - Class wrapper approach
console.log('🎯 Class Wrapper Pattern:');
const projectMgr = new ProjectLogMgr();

// Initialize first, then configure
const logger1 = projectMgr.getLogger(); // This triggers initialization
projectMgr.threshold = 'debug';
projectMgr.show = { level: true, timestamp: true };

const childLogger1 = projectMgr.getLogger({ reqId: 'req-001' });

logger1.info.h1('Using class wrapper pattern').emit();
childLogger1.debug.text('Child logger with request ID').emit();

console.log('\n🏭 Factory Function Pattern:');
const factoryMgr = createLogMgr();

// Initialize first, then configure
const logger2 = getProjectLogger(factoryMgr);
factoryMgr.threshold = 'debug';
factoryMgr.show = { level: true, timestamp: true };

const childLogger2 = getProjectLogger(factoryMgr, { reqId: 'req-002' });

logger2.info.h1('Using factory function pattern').emit();
childLogger2.debug.text('Child logger via factory').emit();

console.log('\n✅ Benefits of wrapper patterns:');
console.log('  • Hide generic complexity from most code');
console.log('  • Prevent type mistakes');
console.log('  • Centralize type decisions');
console.log('  • Easy to change logger types project-wide');
