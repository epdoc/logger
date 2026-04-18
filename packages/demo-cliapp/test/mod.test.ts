import { describe, it } from '@std/testing/bdd';
import { expect } from '@std/expect';

describe('@epdoc/demo-cliapp', () => {
  it('should show help with -h flag', async () => {
    const cmd = new Deno.Command('deno', {
      args: ['run', '-A', 'main.ts', '-h'],
    });
    const { code } = await cmd.output();
    expect(code).toBe(0);
  });
});
