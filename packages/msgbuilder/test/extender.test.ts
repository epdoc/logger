import * as MsgBuilder from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import { TestEmitter } from '../src/emitter.ts';

Deno.test('Console.extender', async (t) => {
  await t.step('basic functionality', async (t2) => {
    await t2.step('should create extended builder with custom methods', () => {
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
      assert.strictEqual(typeof builder.text, 'function');
      assert.strictEqual(typeof builder.label, 'function');
      assert.strictEqual(typeof builder.value, 'function');

      // Should have custom methods
      // deno-lint-ignore no-explicit-any
      assert.strictEqual(typeof (builder as any).apiCall, 'function');
      // deno-lint-ignore no-explicit-any
      assert.strictEqual(typeof (builder as any).metric, 'function');
    });

    await t2.step('should allow method chaining with custom methods', () => {
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

      assert.ok(/\[SUCCESS\]\s+Operation completed\s+\[ERROR\]/.test(result));
    });

    await t2.step('should preserve this context in custom methods', () => {
      const ExtendedBuilder = MsgBuilder.Console.extender({
        customLabel(text: string) {
          return this.label('CUSTOM').text(': ').text(text);
        },
      });

      const emitter = new TestEmitter();
      const builder = new ExtendedBuilder(emitter);

      // deno-lint-ignore no-explicit-any
      const result = (builder as any).customLabel('test message').format({ color: false });
      assert.ok(/CUSTOM\s*:\s*test message/.test(result));
    });
  });

  await t.step('edge cases', async (t2) => {
    await t2.step('should handle empty extensions object', () => {
      const EmptyBuilder = MsgBuilder.Console.extender({});
      const emitter = new TestEmitter();
      const builder = new EmptyBuilder(emitter);

      const result = builder.text('hello').format({ color: false });
      assert.deepStrictEqual(result, 'hello');
    });
  });

  await t.step('demonstrates usage patterns', async (t2) => {
    await t2.step('shows basic extension pattern', () => {
      const SimpleBuilder = MsgBuilder.Console.extender({
        apiCall(method: string, endpoint: string) {
          return this.text(`${method} ${endpoint}`);
        },
      });

      const emitter = new TestEmitter();
      const builder = new SimpleBuilder(emitter);

      // deno-lint-ignore no-explicit-any
      const result = (builder as any).apiCall('GET', '/api/users').format({ color: false });
      assert.deepStrictEqual(result, 'GET /api/users');
    });
  });
});
