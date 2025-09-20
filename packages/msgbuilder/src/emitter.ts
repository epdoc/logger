import type { EmitterData, IEmitter } from './types.ts';

export class ConsoleEmitter implements IEmitter {
  dataEnabled: boolean = true;
  emitEnabled: boolean = true;
  stackEnabled: boolean = false;
  emit(msg: EmitterData): EmitterData {
    console.log(msg.formatter.format());
    return msg;
  }
}

export class TestEmitter implements IEmitter {
  dataEnabled: boolean = true;
  emitEnabled: boolean = true;
  stackEnabled: boolean = false;
  color?: boolean;
  output?: string;
  emit(msg: EmitterData): EmitterData {
    this.output = msg.formatter.format({ color: this.color });
    return msg;
  }
}
