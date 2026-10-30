import { describe, expect, it } from 'vitest';
import { moveKey, moveKeys, removeKeys, setKeyGeometries } from '@domain/keys';
import { buildLockedWiringProject } from '../../../helpers/symmetric-wiring-fixtures';

describe('protected key editing', () => {
  it('refuses endpoint and intermediate key movement, rotation and resizing', () => {
    const base = buildLockedWiringProject();
    expect(moveKey(base, { keyId: 'k0', position: { xU: 1, yU: 0 } })).toBe(base);
    expect(moveKey(base, { keyId: 'k1', position: { xU: 2, yU: 1 } })).toBe(base);
    expect(
      setKeyGeometries(base, { changes: [{ keyId: 'k0', geometry: { rotationDeg: 30 } }] }),
    ).toBe(base);
    expect(setKeyGeometries(base, { changes: [{ keyId: 'k0', geometry: { widthU: 2 } }] })).toBe(
      base,
    );
  });

  it('refuses an entire mixed group without moving/deleting its free part', () => {
    const base = buildLockedWiringProject();
    expect(
      moveKeys(base, {
        moves: [
          { keyId: 'k0', position: { xU: 1, yU: 0 } },
          { keyId: 'k3', position: { xU: 7, yU: 2 } },
        ],
      }),
    ).toBe(base);
    expect(removeKeys(base, { keyIds: ['k3', 'k0'] })).toBe(base);
  });

  it('allows movement of a remote key on the same net when the junction stays fixed', () => {
    const base = buildLockedWiringProject();
    const next = moveKey(base, { keyId: 'k2', position: { xU: 4, yU: 3 } });
    expect(next).not.toBe(base);
    expect(next.keys.find((key) => key.id === 'k2')?.yU).toBe(3);
    expect(next.wires[0]).toEqual(base.wires[0]);
  });
});
