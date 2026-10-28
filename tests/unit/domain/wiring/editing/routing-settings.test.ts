import { getResultValue, getResultError } from '../../../../helpers/result';
import { describe, expect, it } from 'vitest';
import { getRoutingSettings, validateRoutingSettings } from '@domain/wiring';
import { setRoutingSettings } from '@domain/wiring/editing';
import { removeKey } from '@domain/keys';
import { ZMK_LIMITS } from '@catalog/firmware';
import type { Project, RoutingSettings } from '@domain';
import { buildProject } from '../../../../helpers/build-project';

const SETTINGS: RoutingSettings = {
  matrixStyle: 'symmetric-bus',
  offsetU: 0.15,
  clearanceU: 0.1,
  fallbackRowIntervalU: 1,
  preferredScope: 'all',
};
const project = (): Project =>
  buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 2, yU: 0 },
    ],
  });

describe('routing settings', () => {
  it('reads legacy-safe defaults without adding anything to the project', () => {
    const input = project();
    expect(getRoutingSettings(input)).toMatchObject({
      matrixStyle: 'existing',
      offsetU: 0.15,
      clearanceU: 0.1,
      fallbackRowIntervalU: 1,
      preferredScope: 'all',
    });
    expect(input).not.toHaveProperty('routing');
  });

  it('normalizes precision and returns the original on an identical saved setting', () => {
    const input = project();
    const result = setRoutingSettings(input, {
      settings: { ...SETTINGS, offsetU: 0.1500001 },
      limits: ZMK_LIMITS,
    });
    expect(result.ok).toBe(true);
    const after = getResultValue(result);
    expect(after.routing?.offsetU).toBe(0.15);
    expect(input).not.toHaveProperty('routing');
    const repeated = setRoutingSettings(after, { settings: SETTINGS, limits: ZMK_LIMITS });
    expect(repeated).toEqual({ ok: true, value: after });
    expect(getResultValue(repeated)).toBe(after);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 0.00001])(
    'refuses unusable distance %s without changing the input',
    (clearanceU) => {
      const input = project();
      const result = setRoutingSettings(input, {
        settings: { ...SETTINGS, clearanceU },
        limits: ZMK_LIMITS,
      });
      expect(result.ok).toBe(false);
      expect(input).not.toHaveProperty('routing');
      expect(getResultError(result)).toContainEqual(
        expect.objectContaining({ path: ['routing', 'clearanceU'] }),
      );
    },
  );

  it('reports desired cell conflicts without changing the actual circuit', () => {
    const settings = {
      ...SETTINGS,
      targetCells: [
        { keyId: 'k0', half: 'left' as const, row: 0, col: 0 },
        { keyId: 'k1', half: 'left' as const, row: 0, col: 0 },
      ],
    };
    const input = project();
    const result = setRoutingSettings(input, { settings, limits: ZMK_LIMITS });
    expect(result.ok).toBe(true);
    expect(validateRoutingSettings(input, { settings, limits: ZMK_LIMITS })).toContainEqual(
      expect.objectContaining({
        code: 'routing-cell-conflict',
        path: ['routing', 'targetCells', 1],
      }),
    );
    expect(getResultValue(result).wires).toBe(input.wires);
  });

  it('removes only the deleted key’s desired assignment and preserves the immutable original', () => {
    const input: Project = {
      ...project(),
      routing: {
        ...SETTINGS,
        targetCells: [
          { keyId: 'k0', half: 'left', row: 0, col: 0 },
          { keyId: 'k1', half: 'left', row: 0, col: 1 },
        ],
      },
    };
    const after = removeKey(input, { keyId: 'k0' });
    expect(after.routing?.targetCells).toEqual([{ keyId: 'k1', half: 'left', row: 0, col: 1 }]);
    expect(input.routing?.targetCells).toHaveLength(2);
  });
});
