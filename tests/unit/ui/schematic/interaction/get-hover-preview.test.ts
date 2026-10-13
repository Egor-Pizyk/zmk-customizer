import { describe, expect, it } from 'vitest';
import { buildProject } from '../../../../helpers/build-project';
import { getHoverPreview } from '@ui/schematic';

const PROJECT = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
const DRAFT = {
  start: { kind: 'free', at: { xU: 3, yU: 3 } },
  startPoint: { xU: 3, yU: 3 },
  bends: [],
  lastClick: { point: { xU: 3, yU: 3 }, timeMs: 0 },
} as const;

describe('getHoverPreview', () => {
  it('shows where the Key tool would place a key, and whether the cell is free', () => {
    const free = getHoverPreview(PROJECT, {
      activeToolId: 'add-key',
      hover: { world: { xU: 3.1, yU: 2.9 }, hit: { kind: 'empty' } },
      snapGridU: 0.25,
      draft: undefined,
    });
    expect(free.ghostKey).toEqual({ position: { xU: 2.5, yU: 2.5 }, isFree: true });
    const taken = getHoverPreview(PROJECT, {
      activeToolId: 'add-key',
      hover: { world: { xU: 0.6, yU: 0.6 }, hit: { kind: 'key', keyId: 'k1' } },
      snapGridU: 0.25,
      draft: undefined,
    });
    expect(taken.ghostKey?.isFree).toBe(false);
  });

  it('snaps the wire being drawn to the pin under the cursor before the click', () => {
    const preview = getHoverPreview(PROJECT, {
      activeToolId: 'wire',
      hover: { world: { xU: 0.35, yU: 0.4 }, hit: { kind: 'pin', keyId: 'k1', pin: 1 } },
      snapGridU: 0.25,
      draft: DRAFT,
    });
    expect(preview.snapTarget).toEqual({ xU: 0.3, yU: 0.3667 });
    expect(preview.draftPath?.at(-1)).toEqual({ xU: 0.3, yU: 0.3667 });
  });

  it('marks the pin under the cursor even before the wire starts', () => {
    const preview = getHoverPreview(PROJECT, {
      activeToolId: 'wire',
      hover: { world: { xU: 0.62, yU: 0.25 }, hit: { kind: 'pin', keyId: 'k1', pin: 2 } },
      snapGridU: 0.25,
      draft: undefined,
    });
    expect(preview.snapTarget).toEqual({ xU: 0.6333, yU: 0.2333 });
    expect(preview.draftPath).toBeUndefined();
  });

  it('shows nothing for the Select tool', () => {
    const preview = getHoverPreview(PROJECT, {
      activeToolId: 'select',
      hover: { world: { xU: 1, yU: 1 }, hit: { kind: 'empty' } },
      snapGridU: 0.25,
      draft: undefined,
    });
    expect(preview).toEqual({ draftPath: undefined, snapTarget: undefined, ghostKey: undefined });
  });
});
