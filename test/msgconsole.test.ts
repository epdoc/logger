import { StringEx } from '@epdoc/string';
import { assertEquals } from '@std/assert';
import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console;

const logMgr = new Log.Mgr();
const log: Log.std.Logger<M> = logMgr.getLogger() as Log.std.Logger<M>;

describe('MsgBuilder.Console', () => {
  test('display applyColors', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const builder = msgBuilder
      .h1('h1')
      .h2('h2')
      .h3('h3')
      .action('action')
      .label('label')
      .highlight('highlight')
      .value('value')
      .path('path')
      .date('date')
      .strikethru('strikethru')
      .warn('warn')
      .error('error');
    const result = builder.format(true, 'text');
    console.log(result);
    expect(result).toMatch(
      /^.*h1.*h2.*h3.*action.*label.*highlight.*value.*path.*date.*strikethru.*warn.*error.*$/
    );
    const r2 = builder.format(false);
    console.log(r2);
    expect(r2).toEqual('h1 h2 h3 action label highlight value path date strikethru warn error');
    const obj = builder.emit();
    expect(obj.level).toBe('INFO');
  });
  test('display no colors', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder
      .h1('h1')
      .h2('h2')
      .h3('h3')
      .action('action')
      .label('label')
      .highlight('highlight')
      .value('value')
      .path('path')
      .date('date')
      .strikethru('strikethru')
      .warn('warn')
      .error('error')
      .format(false, 'text');
    console.log(result);
    assertEquals(result, 'h1 h2 h3 action label highlight value path date strikethru warn error');
  });
  test('display elapsed no color', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.h1('h1').ewt(8);
    assertEquals(result.level, 'INFO');

    // assertEquals(true, /^h1 \([\d\.]+ ms response\)$/.test(str));
  });
  test('display elapsed applyColor', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const str = msgBuilder.value('value').format(true, 'text');
    console.log(str);
    assertEquals(true, /value/.test(str));
  });
  test('h1', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.h1('h1').format(true);
    assertEquals(result, '\x1b[1m\x1b[35mh1\x1b[39m\x1b[22m');
  });
  test('h2', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.h2('h2').format(true);
    assertEquals(result, '\x1b[35mh2\x1b[39m');
  });
  test('h3', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.h3('h3').format(true);
    assertEquals(StringEx(result).hexEncode(), '001b005b00330033006d00680033001b005b00330039006d');
  });
  test('action', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.action('action').format(true);
    assertEquals(
      StringEx(result).hexEncode(),
      '001b005b00330030006d001b005b00340033006d0061006300740069006f006e001b005b00340039006d001b005b00330039006d'
    );
  });
  test('label', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.label('label').format(true);
    assertEquals(result, '\x1b[34mlabel\x1b[39m');
  });
  test('highlight', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.highlight('highlight').format(true);
    assertEquals(
      StringEx(result).hexEncode(),
      '001b005b00390035006d0068006900670068006c0069006700680074001b005b00330039006d'
    );
  });
  test('value', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.value('value').format(true);
    assertEquals(
      StringEx(result).hexEncode(),
      '001b005b00330032006d00760061006c00750065001b005b00330039006d'
    );
  });
  test('path', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.path('path').format(true);
    assertEquals(
      StringEx(result).hexEncode(),
      '001b005b0034006d001b005b00390030006d0070006100740068001b005b00330039006d001b005b00320034006d'
    );
  });
  test('date', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.date('date').format(true);
    assertEquals(StringEx(result).hexEncode(), '001b005b00390036006d0064006100740065001b005b00330039006d');
  });
  test('warn', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.warn('warn').format(true);
    assertEquals(StringEx(result).hexEncode(), '001b005b00390033006d007700610072006e001b005b00330039006d');
  });
  test('error', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.error('error').format(true);
    assertEquals(
      StringEx(result).hexEncode(),
      '001b005b0031006d001b005b00390031006d006500720072006f0072001b005b00330039006d001b005b00320032006d'
    );
  });
  test('strikethru', () => {
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
    const result = msgBuilder.strikethru('strikethru').format(true);
    assertEquals(
      StringEx(result).hexEncode(),
      '001b005b0037006d0073007400720069006b00650074006800720075001b005b00320037006d'
    );
  });
});
