import type { CompareResult } from '@epdoc/type';
import type * as Level from './types.ts';

export function compareLevels(levelA: Level.Spec, levelB: Level.Spec): CompareResult {
  return (levelA.severity > levelB.severity) ? +1 : (levelA.severity === levelB.severity) ? 0 : -1;
}

export function applyColors(msg: string, spec: Level.Spec | null): string {
  if (spec && spec.fmtFn) {
    return spec.fmtFn(msg);
  }
  return msg;
}
