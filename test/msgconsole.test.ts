import { StringEx } from '@epdoc/string';
import { assertEquals } from '@std/assert';
import { Log } from '../mod.ts';

const logMgr = new Log.Mgr('std');
const log: Log.std.Logger = logMgr.getLogger() as Log.std.Logger;

Deno.test('test', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  assertEquals(msgBuilder.emit('test').msg, 'test');
});
Deno.test('display applyColors', () => {
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
    .emit();
  console.log(result.msg);
  assertEquals(result.level, 'INFO');
  assertEquals(
    /^.*h1.*h2.*h3.*action.*label.*highlight.*value.*path.*date.*strikethru.*warn.*error.*$/.test(result.msg),
    true
  );
});
Deno.test('display no colors', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log).noColors();
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
    .emit();
  console.log(result.msg);
  assertEquals(result.msg, 'h1 h2 h3 action label highlight value path date strikethru warn error');
});
Deno.test('display elapsed no color', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log).noColors();
  const result: Log.Entry = msgBuilder.h1('h1').ewt(8);
  console.log(result.msg);
  assertEquals(true, /^h1 \([\d\.]+ ms response\)$/.test(result.msg));
});
Deno.test('display elapsed applyColor', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.value('value').ewt(5);
  console.log(result.msg);
  assertEquals(true, /value/.test(result.msg));
  assertEquals(true, /ms response/.test(result.msg));
});
Deno.test('h1', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.h1('h1').emit();
  assertEquals(result.msg, '\x1b[1m\x1b[35mh1\x1b[39m\x1b[22m');
});
Deno.test('h2', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.h2('h2').emit();
  assertEquals(result.msg, '\x1b[35mh2\x1b[39m');
});
Deno.test('h3', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.h3('h3').emit();
  assertEquals(StringEx(result.msg).hexEncode(), '001b005b00330033006d00680033001b005b00330039006d');
});
Deno.test('action', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.action('action').emit();
  assertEquals(
    StringEx(result.msg).hexEncode(),
    '001b005b00330030006d001b005b00340033006d0061006300740069006f006e001b005b00340039006d001b005b00330039006d'
  );
});
Deno.test('label', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.label('label').emit();
  assertEquals(result.msg, '\x1b[34mlabel\x1b[39m');
});
Deno.test('highlight', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.highlight('highlight').emit();
  assertEquals(
    StringEx(result.msg).hexEncode(),
    '001b005b00390035006d0068006900670068006c0069006700680074001b005b00330039006d'
  );
});
Deno.test('value', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.value('value').emit();
  assertEquals(
    StringEx(result.msg).hexEncode(),
    '001b005b00330032006d00760061006c00750065001b005b00330039006d'
  );
});
Deno.test('path', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.path('path').emit();
  assertEquals(
    StringEx(result.msg).hexEncode(),
    '001b005b0034006d001b005b00390030006d0070006100740068001b005b00330039006d001b005b00320034006d'
  );
});
Deno.test('date', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.date('date').emit();
  assertEquals(StringEx(result.msg).hexEncode(), '001b005b00390036006d0064006100740065001b005b00330039006d');
});
Deno.test('warn', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.warn('warn').emit();
  assertEquals(StringEx(result.msg).hexEncode(), '001b005b00390033006d007700610072006e001b005b00330039006d');
});
Deno.test('error', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.error('error').emit();
  assertEquals(
    StringEx(result.msg).hexEncode(),
    '001b005b0031006d001b005b00390031006d006500720072006f0072001b005b00330039006d001b005b00320032006d'
  );
});
Deno.test('strikethru', () => {
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log);
  const result = msgBuilder.strikethru('strikethru').emit();
  assertEquals(
    StringEx(result.msg).hexEncode(),
    '001b005b0037006d0073007400720069006b00650074006800720075001b005b00320037006d'
  );
});
