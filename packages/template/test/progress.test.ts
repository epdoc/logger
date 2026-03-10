import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { Ctx , ProgressLogInfo} from '../src/mod.ts';
import { delayPromise } from '@epdoc/type';

const pkg = { name: 'test', description: 'none', version: '0.0.0'}

describe('progress-info',() => {
  it('x',()=>{
    const ctx = new Ctx.Context(pkg);
    ctx.progress.info.text('Downloading').label('fakefile.rsc').start();
    await delayPromise(1000);
    ctx.progress.info.text('Downloaded').label('thefile.rsc').stop();
  });
});
