import type { HoldTapTarget } from '@domain';

export function getTargetParameterKind(target: HoldTapTarget): 'key' | 'layer' | 'dummy' {
  if (target === 'kp' || target === 'sk' || target === 'kt') {
    return 'key';
  }
  if (target === 'mo' || target === 'tog' || target === 'to' || target === 'sl') {
    return 'layer';
  }
  return 'dummy';
}
