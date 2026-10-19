import { assertNever } from '@domain';
import type { CustomBehavior } from '@domain';

type CreateBehaviorInput = {
  readonly id: string;
  readonly name: string;
  readonly kind: CustomBehavior['kind'];
};

export function createBehavior(input: CreateBehaviorInput): CustomBehavior {
  const identity = { id: input.id, name: input.name };
  const key = { kind: 'kp', key: { keycode: 'A', modifiers: [] } } as const;
  switch (input.kind) {
    case 'hold-tap': {
      return createHoldTap(identity);
    }
    case 'tap-dance': {
      return {
        ...identity,
        kind: input.kind,
        bindings: [
          { id: 'a0', binding: key },
          { id: 'a1', binding: { kind: 'kp', key: { keycode: 'B', modifiers: [] } } },
        ],
        tappingTermMs: 200,
      };
    }
    case 'mod-morph': {
      return createModMorph(identity);
    }
    case 'sticky-key':
    case 'sticky-layer': {
      return {
        ...identity,
        kind: input.kind,
        releaseAfterMs: 1000,
        quickRelease: input.kind === 'sticky-layer',
        lazy: false,
        ignoreModifiers: input.kind === 'sticky-key',
      };
    }
    default: {
      return assertNever(input.kind);
    }
  }
}

function createHoldTap(identity: { readonly id: string; readonly name: string }): CustomBehavior {
  return {
    ...identity,
    kind: 'hold-tap',
    holdBehavior: 'kp',
    tapBehavior: 'kp',
    flavor: 'hold-preferred',
    tappingTermMs: 200,
    quickTapMs: -1,
    requirePriorIdleMs: -1,
    retroTap: false,
    holdWhileUndecided: false,
    holdWhileUndecidedLinger: false,
    triggerKeyIds: [],
    holdTriggerOnRelease: false,
  };
}

function createModMorph(identity: { readonly id: string; readonly name: string }): CustomBehavior {
  const key = { kind: 'kp', key: { keycode: 'A', modifiers: [] } } as const;
  return {
    ...identity,
    kind: 'mod-morph',
    normal: key,
    morphed: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
    mods: ['LS'],
    keepMods: [],
  };
}
