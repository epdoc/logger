/**
 * @file Example showing the new simple MsgBuilder extension
 * @description Demonstrates how easy it is now to extend Console.Builder
 */

import * as Log from '@epdoc/logger';
import { extendBuilder } from '@epdoc/msgbuilder';

// ===== NEW SIMPLE WAY =====

// 1. Define custom methods easily
const MyBuilder = extendBuilder({
  apiCall(method: string, endpoint: string) {
    return this.label(method).text(' ').underline.text(endpoint);
  },
  
  metric(name: string, value: number, unit?: string) {
    return this.cyan.text(name).text(': ').bold.white.text(value.toString()).gray.text(unit || '');
  },
  
  status(status: 'success' | 'error' | 'pending') {
    const colors = { success: 'green', error: 'red', pending: 'yellow' } as const;
    return (this as any)[colors[status]].text(`[${status.toUpperCase()}]`);
  }
});

// 2. Create logger manager with one line
const logMgr = Log.createLogManager(MyBuilder, { 
  threshold: 'info',
  showData: true 
});

// 3. Use it!
const logger = logMgr.getLogger<Log.Std.Logger<InstanceType<typeof MyBuilder>>>();

// ===== DEMO =====

function demo() {
  console.log('=== New Simple MsgBuilder Extension ===\n');
  
  // Use custom methods
  logger.info.apiCall('GET', '/api/users').emit();
  logger.info.status('success').text(' Request completed').emit();
  logger.info.metric('Response Time', 245, 'ms').emit();
  logger.info.metric('Users Found', 42).emit();
  logger.warn.status('pending').text(' Still processing...').emit();
  logger.error.status('error').text(' Connection failed').emit();
  
  console.log('\nThat was easy! No complex inheritance or factory setup needed.');
}

// ===== REAL WORLD EXAMPLES =====

// What turl could easily add:
const TurlBuilder = extendBuilder({
  url(url: string) {
    return this.underline.blue.text(url);
  },
  download(progress: number, total: number) {
    const percent = Math.round((progress / total) * 100);
    return this.cyan.text(`[${progress}/${total}]`).gray.text(` ${percent}%`);
  }
});

// What bikelog could easily add:
const BikelogBuilder = extendBuilder({
  year(year: number) {
    return this.bold.magenta.text(year.toString());
  },
  pages(count: number, type: string) {
    return this.green.text(count.toString()).gray.text(` ${type} pages`);
  }
});

// What routergen could easily add:
const RoutergenBuilder = extendBuilder({
  device(name: string, ip: string) {
    return this.cyan.text(name).gray.text(' (').yellow.text(ip).gray.text(')');
  },
  config(section: string) {
    return this.bold.blue.text(`[${section}]`);
  }
});

function demoRealWorld() {
  console.log('\n=== Real World Examples ===\n');
  
  const turlLogger = Log.createLogManager(TurlBuilder).getLogger();
  const bikelogLogger = Log.createLogManager(BikelogBuilder).getLogger();
  const routergenLogger = Log.createLogManager(RoutergenBuilder).getLogger();
  
  // turl usage
  turlLogger.info.text('Downloading: ').url('https://example.com/video.mp4').emit();
  turlLogger.info.download(75, 100).text(' Complete').emit();
  
  // bikelog usage  
  bikelogLogger.info.text('Generating report for ').year(2024).emit();
  bikelogLogger.info.text('Created ').pages(12, 'maintenance').emit();
  
  // routergen usage
  routergenLogger.info.device('Router-Main', '192.168.1.1').text(' configured').emit();
  routergenLogger.info.config('wireless').text(' section updated').emit();
}

if (import.meta.main) {
  demo();
  demoRealWorld();
}
