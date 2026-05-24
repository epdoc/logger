import * as assert from 'node:assert';
import * as MsgBuilder from '../src/mod.ts';

Deno.test('Dim Mode Tests', async (t) => {
  await t.step('dim() toggles dim mode on (from default off)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim().text('dimmed text');
    const result = msg.format({ color: true });

    // Check that ANSI dim codes are present (\x1b[2m = dim on)
    assert.ok(result.includes('\x1b[2m'));
    console.log('dim() toggle on:', result);
  });

  await t.step('dim() toggles dim mode off when already on', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim().text('dimmed').dim().text('normal');
    const result = msg.format({ color: true });

    assert.ok(result.includes('dimmed'));
    assert.ok(result.includes('normal'));
    console.log('dim() toggle off:', result);
  });

  await t.step('dim(true) enables dim mode', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).text('dimmed text');
    const result = msg.format({ color: true });

    assert.ok(result.includes('\x1b[2m'));
    console.log('dim(true) result:', result);
  });

  await t.step('dim(false) disables dim mode', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).text('dimmed').dim(false).text(' normal');
    const result = msg.format({ color: true });

    assert.ok(result.includes('dimmed'));
    assert.ok(result.includes('normal'));
    console.log('dim(false) result:', result);
  });

  await t.step('undim() is alias for dim(false)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).text('dimmed').undim().text(' normal');
    const result = msg.format({ color: true });

    assert.ok(result.includes('dimmed'));
    assert.ok(result.includes('normal'));
    console.log('undim() result:', result);
  });

  await t.step('dim() with string applies dim styling only (not mode)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim('dimmed once').text(' normal text');
    const result = msg.format({ color: true });

    assert.ok(result.includes('dimmed once'));
    assert.ok(result.includes('normal text'));
    console.log('dim(text) result:', result);
  });

  await t.step('dim mode persists across multiple calls', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).h1('header').text('body').value('data');
    const result = msg.format({ color: true });

    // All parts should have dim codes
    assert.ok(result.includes('\x1b[2m'));
    console.log('persistent dim result:', result);
  });

  await t.step('dim mode with colors disabled', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).text('no color');
    const result = msg.format({ color: false });

    // No dim codes when color is disabled
    assert.ok(!result.includes('\x1b[2m'));
    assert.deepStrictEqual(result, 'no color');
    console.log('no color result:', result);
  });
});

Deno.test('Bold Mode Tests', async (t) => {
  await t.step('bold() toggles bold mode on (from default off)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold().text('bold text');
    const result = msg.format({ color: true });

    // Check that ANSI bold codes are present (\x1b[1m = bold on)
    assert.ok(result.includes('\x1b[1m'));
    console.log('bold() toggle on:', result);
  });

  await t.step('bold() toggles bold mode off when already on', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold().text('bold').bold().text('normal');
    const result = msg.format({ color: true });

    assert.ok(result.includes('bold'));
    assert.ok(result.includes('normal'));
    console.log('bold() toggle off:', result);
  });

  await t.step('bold(true) enables bold mode', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).text('bold text');
    const result = msg.format({ color: true });

    assert.ok(result.includes('\x1b[1m'));
    console.log('bold(true) result:', result);
  });

  await t.step('bold(false) disables bold mode', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).text('bold').bold(false).text(' normal');
    const result = msg.format({ color: true });

    assert.ok(result.includes('bold'));
    assert.ok(result.includes('normal'));
    console.log('bold(false) result:', result);
  });

  await t.step('unbold() is alias for bold(false)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).text('bold').unbold().text(' normal');
    const result = msg.format({ color: true });

    assert.ok(result.includes('bold'));
    assert.ok(result.includes('normal'));
    console.log('unbold() result:', result);
  });

  await t.step('bold() with string applies bold styling only (not mode)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold('bold once').text(' normal text');
    const result = msg.format({ color: true });

    assert.ok(result.includes('bold once'));
    assert.ok(result.includes('normal text'));
    console.log('bold(text) result:', result);
  });

  await t.step('bold mode persists across multiple calls', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).h1('header').text('body').value('data');
    const result = msg.format({ color: true });

    // All parts should have bold codes
    assert.ok(result.includes('\x1b[1m'));
    console.log('persistent bold result:', result);
  });

  await t.step('bold mode with colors disabled', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).text('no color');
    const result = msg.format({ color: false });

    // No bold codes when color is disabled
    assert.ok(!result.includes('\x1b[1m'));
    assert.deepStrictEqual(result, 'no color');
    console.log('no color result:', result);
  });

  await t.step('bold and dim modes combine', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).dim(true).text('bold and dim');
    const result = msg.format({ color: true });

    // Should have both bold and dim ANSI codes
    assert.ok(result.includes('\x1b[1m'));
    assert.ok(result.includes('\x1b[2m'));
    console.log('bold+dim result:', result);
  });
});
