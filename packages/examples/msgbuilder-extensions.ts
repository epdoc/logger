/**
 * @file Example demonstrating MsgBuilder extensions
 * @description Shows current complex way vs proposed simple way to extend Console.Builder
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// ===== CURRENT WAY (Complex - like finsync) =====

class CustomMsgBuilder extends Console.Builder {
  // Custom methods for app-specific logging
  apiCall(method: string, endpoint: string): this {
    return this.label(method).text(' ').underline.text(endpoint);
  }
  
  metric(name: string, value: number, unit?: string): this {
    return this.cyan.text(name).text(': ').bold.white.text(value.toString()).gray.text(unit || '');
  }
  
  status(status: 'success' | 'error' | 'pending'): this {
    const colors = { success: 'green', error: 'red', pending: 'yellow' } as const;
    return (this as any)[colors[status]].text(`[${status.toUpperCase()}]`);
  }
}

// Complex factory setup required
const msgBuilderFactory = (emitter: any): CustomMsgBuilder => {
  return new CustomMsgBuilder(emitter);
};

// Complex logger manager setup
const complexLogMgr: Log.Mgr<CustomMsgBuilder> = new Log.Mgr<CustomMsgBuilder>();
complexLogMgr.msgBuilderFactory = msgBuilderFactory;
complexLogMgr.init();
complexLogMgr.threshold = 'info';

type ComplexLogger = Log.Std.Logger<CustomMsgBuilder>;

// ===== PROPOSED WAY (Simple - what we want) =====

// This would be the helper function in @epdoc/msgbuilder
function extendBuilder<T extends Record<string, Function>>(
  extensions: T
): new (emitter: any) => Console.Builder & T {
  class ExtendedBuilder extends Console.Builder {
    constructor(emitter: any) {
      super(emitter);
      // Bind extension methods to this instance
      Object.entries(extensions).forEach(([name, method]) => {
        (this as any)[name] = method.bind(this);
      });
    }
  }
  return ExtendedBuilder as any;
}

// Simple extension definition
const SimpleBuilder = extendBuilder({
  apiCall(this: Console.Builder, method: string, endpoint: string) {
    return this.label(method).text(' ').underline.text(endpoint);
  },
  
  metric(this: Console.Builder, name: string, value: number, unit?: string) {
    return this.cyan.text(name).text(': ').bold.white.text(value.toString()).gray.text(unit || '');
  },
  
  status(this: Console.Builder, status: 'success' | 'error' | 'pending') {
    const colors = { success: 'green', error: 'red', pending: 'yellow' } as const;
    return (this as any)[colors[status]].text(`[${status.toUpperCase()}]`);
  }
});

// Simple logger manager setup (proposed helper)
function createLogManager<T extends Console.Builder>(
  BuilderClass: new (emitter: any) => T,
  options: { threshold?: string } = {}
): Log.Mgr<T> {
  const mgr = new Log.Mgr<T>();
  mgr.msgBuilderFactory = (emitter: any) => new BuilderClass(emitter);
  mgr.init();
  if (options.threshold) mgr.threshold = options.threshold as any;
  return mgr;
}

const simpleLogMgr = createLogManager(SimpleBuilder, { threshold: 'info' });
type SimpleLogger = Log.Std.Logger<InstanceType<typeof SimpleBuilder>>;

// ===== DEMO USAGE =====

function demoComplexWay() {
  console.log('\n=== Current Complex Way ===');
  const logger = complexLogMgr.getLogger<ComplexLogger>();
  
  // These work but required lots of setup
  logger.info.apiCall('GET', '/api/users').emit();
  logger.info.status('success').text(' Request completed').emit();
  logger.info.metric('Response Time', 245, 'ms').emit();
}

function demoSimpleWay() {
  console.log('\n=== Proposed Simple Way ===');
  const logger = simpleLogMgr.getLogger<SimpleLogger>();
  
  // Same functionality, much easier setup
  logger.info.apiCall('POST', '/api/data').emit();
  logger.info.status('pending').text(' Processing request').emit();
  logger.info.metric('Users', 1337).emit();
}

function demoRealWorldExample() {
  console.log('\n=== Real World: Projects That Could Benefit ===');
  
  // turl could have:
  const TurlBuilder = extendBuilder({
    url(this: Console.Builder, url: string) {
      return this.underline.blue.text(url);
    },
    download(this: Console.Builder, progress: number, total: number) {
      const percent = Math.round((progress / total) * 100);
      return this.cyan.text(`[${progress}/${total}]`).gray.text(` ${percent}%`);
    }
  });
  
  // bikelog could have:
  const BikelogBuilder = extendBuilder({
    year(this: Console.Builder, year: number) {
      return this.bold.magenta.text(year.toString());
    },
    pages(this: Console.Builder, count: number, type: string) {
      return this.green.text(count.toString()).gray.text(` ${type} pages`);
    }
  });
  
  // routergen could have:
  const RoutergenBuilder = extendBuilder({
    device(this: Console.Builder, name: string, ip: string) {
      return this.cyan.text(name).gray.text(' (').yellow.text(ip).gray.text(')');
    },
    config(this: Console.Builder, section: string) {
      return this.bold.blue.text(`[${section}]`);
    }
  });
  
  console.log('These projects could easily add custom methods with the helper!');
}

if (import.meta.main) {
  demoComplexWay();
  demoSimpleWay();
  demoRealWorldExample();
}
