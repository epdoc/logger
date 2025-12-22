/**
 * @file Example demonstrating MsgBuilder extensions
 * @description Shows current complex way vs simple way using extendBuilder helper
 */

import { Console } from '@epdoc/msgbuilder';

// ===== CURRENT WAY (Complex - like finsync) =====

class CustomMsgBuilder extends Console.Builder {
  // Custom methods for app-specific logging
  apiCall(method: string, endpoint: string): this {
    return this.label(method).text(' ').text(endpoint);
  }

  metric(name: string, value: number, unit?: string): this {
    return this.text(name).text(': ').value(value.toString()).text(unit || '');
  }

  status(status: 'success' | 'error' | 'pending'): this {
    const text = `[${status.toUpperCase()}]`;
    switch (status) {
      case 'success':
        return this.success(text);
      case 'error':
        return this.error(text);
      case 'pending':
        return this.warn(text);
    }
  }
}

// ===== SIMPLE WAY (Using extendBuilder helper) =====

// Simple extension definition
const SimpleBuilder = Console.extender({
  apiCall(method: string, endpoint: string) {
    return this.label(method).text(' ').text(endpoint);
  },

  metric(name: string, value: number, unit?: string) {
    return this.text(name).text(': ').value(value.toString()).text(unit || '');
  },

  status(status: 'success' | 'error' | 'pending') {
    const text = `[${status.toUpperCase()}]`;
    switch (status) {
      case 'success':
        return this.success(text);
      case 'error':
        return this.error(text);
      case 'pending':
        return this.warn(text);
    }
  },
});

// ===== DEMO USAGE =====

function demoComplexWay() {
  console.log('\n=== Current Complex Way ===');
  const builder = new CustomMsgBuilder();

  // These work but required class inheritance
  builder.apiCall('GET', '/api/users').emit();
  builder.status('success').text(' Request completed').emit();
  builder.metric('Response Time', 245, 'ms').emit();
}

function demoSimpleWay() {
  console.log('\n=== Simple Way with extendBuilder ===');
  // deno-lint-ignore no-explicit-any
  const builder = new SimpleBuilder(undefined as any);

  // Same functionality, much easier setup
  // deno-lint-ignore no-explicit-any
  (builder as any).apiCall('POST', '/api/data').emit();
  // deno-lint-ignore no-explicit-any
  (builder as any).status('pending').text(' Processing request').emit();
  // deno-lint-ignore no-explicit-any
  (builder as any).metric('Users', 1337).emit();
}

function demoRealWorldExamples() {
  console.log('\n=== Real World: Project-Specific Builders ===');

  // turl could have:
  const TurlBuilder = Console.extender({
    downloadUrl(url: string) {
      return this.text('URL: ').url(url);
    },
    progress(current: number, total: number) {
      const percent = Math.round((current / total) * 100);
      return this.text(`[${current}/${total}] ${percent}%`);
    },
  });

  // bikelog could have:
  const BikelogBuilder = Console.extender({
    blogYear(year: number) {
      return this.h2(year.toString());
    },
    pageCount(count: number, type: string) {
      return this.value(count.toString()).text(` ${type} pages`);
    },
  });

  // routergen could have:
  const RoutergenBuilder = Console.extender({
    networkDevice(name: string, ip: string) {
      return this.text(name).text(' (').text(ip).text(')');
    },
    configSection(section: string) {
      return this.h3(`[${section}]`);
    },
  });

  // Demo usage
  // deno-lint-ignore no-explicit-any
  const turlBuilder = new TurlBuilder(undefined as any);
  // deno-lint-ignore no-explicit-any
  (turlBuilder as any).downloadUrl('https://example.com/file.zip').emit();

  // deno-lint-ignore no-explicit-any
  const bikelogBuilder = new BikelogBuilder(undefined as any);
  // deno-lint-ignore no-explicit-any
  (bikelogBuilder as any).blogYear(2024).text(' - ').pageCount(150, 'blog').emit();

  // deno-lint-ignore no-explicit-any
  const routergenBuilder = new RoutergenBuilder(undefined as any);
  // deno-lint-ignore no-explicit-any
  (routergenBuilder as any).networkDevice('Router', '192.168.1.1').emit();

  console.log('\n✨ Projects can easily add custom methods with extendBuilder!');
}

if (import.meta.main) {
  demoComplexWay();
  demoSimpleWay();
  demoRealWorldExamples();
}
