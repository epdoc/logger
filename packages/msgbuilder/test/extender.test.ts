import * as MsgBuilder from '@epdoc/msgbuilder';
import { assertEquals } from '@std/assert';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { TestEmitter } from '../src/emitter.ts';

describe('Console.extender', () => {
  describe('basic functionality', () => {
    test('should create extended builder with custom methods', () => {
      const ExtendedBuilder = MsgBuilder.Console.extender({
        apiCall(method: string, endpoint: string) {
          return this.label(method).text(' ').text(endpoint);
        },
        metric(name: string, value: number) {
          return this.text(name).text(': ').text(value.toString());
        },
      });

      const emitter = new TestEmitter();
      const builder = new ExtendedBuilder(emitter);

      // Should have original Console.Builder methods
      expect(typeof builder.text).toBe('function');
      expect(typeof builder.label).toBe('function');
      expect(typeof builder.value).toBe('function');

      // Should have custom methods
      // deno-lint-ignore no-explicit-any
      expect(typeof (builder as any).apiCall).toBe('function');
      // deno-lint-ignore no-explicit-any
      expect(typeof (builder as any).metric).toBe('function');
    });

    test('should allow method chaining with custom methods', () => {
      const ExtendedBuilder = MsgBuilder.Console.extender({
        status(level: 'success' | 'error') {
          return this.text(`[${level.toUpperCase()}]`);
        },
      });

      const emitter = new TestEmitter();
      const builder = new ExtendedBuilder(emitter);

      // Should support chaining: custom -> built-in -> custom
      // deno-lint-ignore no-explicit-any
      const result = (builder as any)
        .status('success')
        .text(' Operation completed ')
        .status('error')
        .format({ color: false });

      expect(result).toMatch(/\[SUCCESS\]\s+Operation completed\s+\[ERROR\]/);
    });

    test('should preserve this context in custom methods', () => {
      const ExtendedBuilder = MsgBuilder.Console.extender({
        customLabel(text: string) {
          return this.label('CUSTOM').text(': ').text(text);
        },
      });

      const emitter = new TestEmitter();
      const builder = new ExtendedBuilder(emitter);

      // deno-lint-ignore no-explicit-any
      const result = (builder as any).customLabel('test message').format({ color: false });
      expect(result).toMatch(/CUSTOM\s*:\s*test message/);
    });
  });

  describe('edge cases', () => {
    test('should handle empty extensions object', () => {
      const EmptyBuilder = MsgBuilder.Console.extender({});
      const emitter = new TestEmitter();
      const builder = new EmptyBuilder(emitter);

      const result = builder.text('hello').format({ color: false });
      assertEquals(result, 'hello');
    });
  });

  describe('demonstrates usage patterns', () => {
    test('shows basic extension pattern', () => {
      const SimpleBuilder = MsgBuilder.Console.extender({
        apiCall(method: string, endpoint: string) {
          return this.text(`${method} ${endpoint}`);
        },
      });

      const emitter = new TestEmitter();
      const builder = new SimpleBuilder(emitter);

      // deno-lint-ignore no-explicit-any
      const result = (builder as any).apiCall('GET', '/api/users').format({ color: false });
      assertEquals(result, 'GET /api/users');
    });
  });
});
