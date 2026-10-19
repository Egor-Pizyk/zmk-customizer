import type { CustomBehavior } from '@domain';

export function getBehaviorLabel(behavior: CustomBehavior): string {
  const name = behavior.name
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]+/gu, '_')
    .replaceAll(/^_+|_+$/gu, '');
  return `user_${name.slice(0, 16)}_${behavior.id}`;
}
