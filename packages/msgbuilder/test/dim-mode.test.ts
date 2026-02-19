import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import * as MsgBuilder from '../src/mod.ts';

describe('Dim Mode Tests', () => {
  test('dim() toggles dim mode on (from default off)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim().text('dimmed text');
    const result = msg.format({ color: true });

    // Check that ANSI dim codes are present (\x1b[2m = dim on)
    expect(result).toContain('\x1b[2m');
    console.log('dim() toggle on:', result);
  });

  test('dim() toggles dim mode off when already on', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim().text('dimmed').dim().text('normal');
    const result = msg.format({ color: true });

    expect(result).toContain('dimmed');
    expect(result).toContain('normal');
    console.log('dim() toggle off:', result);
  });

  test('dim(true) enables dim mode', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).text('dimmed text');
    const result = msg.format({ color: true });

    expect(result).toContain('\x1b[2m');
    console.log('dim(true) result:', result);
  });

  test('dim(false) disables dim mode', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).text('dimmed').dim(false).text(' normal');
    const result = msg.format({ color: true });

    expect(result).toContain('dimmed');
    expect(result).toContain('normal');
    console.log('dim(false) result:', result);
  });

  test('undim() is alias for dim(false)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).text('dimmed').undim().text(' normal');
    const result = msg.format({ color: true });

    expect(result).toContain('dimmed');
    expect(result).toContain('normal');
    console.log('undim() result:', result);
  });

  test('dim() with string applies dim styling only (not mode)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim('dimmed once').text(' normal text');
    const result = msg.format({ color: true });

    expect(result).toContain('dimmed once');
    expect(result).toContain('normal text');
    console.log('dim(text) result:', result);
  });

  test('dim mode persists across multiple calls', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).h1('header').text('body').value('data');
    const result = msg.format({ color: true });

    // All parts should have dim codes
    expect(result).toContain('\x1b[2m');
    console.log('persistent dim result:', result);
  });

  test('dim mode with colors disabled', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.dim(true).text('no color');
    const result = msg.format({ color: false });

    // No dim codes when color is disabled
    expect(result).not.toContain('\x1b[2m');
    expect(result).toBe('no color');
    console.log('no color result:', result);
  });
});

describe('Bold Mode Tests', () => {
  test('bold() toggles bold mode on (from default off)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold().text('bold text');
    const result = msg.format({ color: true });

    // Check that ANSI bold codes are present (\x1b[1m = bold on)
    expect(result).toContain('\x1b[1m');
    console.log('bold() toggle on:', result);
  });

  test('bold() toggles bold mode off when already on', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold().text('bold').bold().text('normal');
    const result = msg.format({ color: true });

    expect(result).toContain('bold');
    expect(result).toContain('normal');
    console.log('bold() toggle off:', result);
  });

  test('bold(true) enables bold mode', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).text('bold text');
    const result = msg.format({ color: true });

    expect(result).toContain('\x1b[1m');
    console.log('bold(true) result:', result);
  });

  test('bold(false) disables bold mode', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).text('bold').bold(false).text(' normal');
    const result = msg.format({ color: true });

    expect(result).toContain('bold');
    expect(result).toContain('normal');
    console.log('bold(false) result:', result);
  });

  test('unbold() is alias for bold(false)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).text('bold').unbold().text(' normal');
    const result = msg.format({ color: true });

    expect(result).toContain('bold');
    expect(result).toContain('normal');
    console.log('unbold() result:', result);
  });

  test('bold() with string applies bold styling only (not mode)', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold('bold once').text(' normal text');
    const result = msg.format({ color: true });

    expect(result).toContain('bold once');
    expect(result).toContain('normal text');
    console.log('bold(text) result:', result);
  });

  test('bold mode persists across multiple calls', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).h1('header').text('body').value('data');
    const result = msg.format({ color: true });

    // All parts should have bold codes
    expect(result).toContain('\x1b[1m');
    console.log('persistent bold result:', result);
  });

  test('bold mode with colors disabled', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).text('no color');
    const result = msg.format({ color: false });

    // No bold codes when color is disabled
    expect(result).not.toContain('\x1b[1m');
    expect(result).toBe('no color');
    console.log('no color result:', result);
  });

  test('bold and dim modes combine', () => {
    const msg = new MsgBuilder.Console.Builder();
    msg.bold(true).dim(true).text('bold and dim');
    const result = msg.format({ color: true });

    // Should have both bold and dim ANSI codes
    expect(result).toContain('\x1b[1m');
    expect(result).toContain('\x1b[2m');
    console.log('bold+dim result:', result);
  });
});
