import { getResultValue } from '../../../helpers/result';
import { describe, expect, it } from 'vitest';
import { createProject } from '@domain/project';
import { getProjectJsonSchema, parseProjectFile, serializeProject } from '@storage/project';
import legacy from '../../../fixtures/project/v13.json?raw';
import locked from '../../../fixtures/schematic/040-locked.json?raw';

const ROUTING = {
  matrixStyle: 'symmetric-bus',
  offsetU: 0.15,
  clearanceU: 0.1,
  fallbackRowIntervalU: 1,
  mirrorAxisXU: 6,
  preferredScope: 'half',
  preferredHalf: 'left',
  rowPin: 1,
  diodeSide: 'row',
  targetCells: [{ keyId: 'k0', half: 'left', row: 0, col: 0 }],
};

function file(patch: Readonly<Record<string, unknown>> = {}) {
  return JSON.stringify({
    ...createProject({ controllerId: 'nice_nano_v2' }),
    schemaVersion: 14,
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    routing: ROUTING,
    ...patch,
  });
}

function paths(raw: string) {
  const result = parseProjectFile(raw);
  return result.ok || result.error.kind !== 'not-project'
    ? []
    : result.error.issues.map((issue) => issue.path);
}

describe('routing project persistence', () => {
  it('round trips routing settings and desired assignments without creating wires', () => {
    const project = getResultValue(parseProjectFile(file()));
    expect(project).toMatchObject({ schemaVersion: 14, routing: ROUTING, wires: [] });
    const saved = getResultValue(serializeProject(project));
    expect(getResultValue(parseProjectFile(saved))).toEqual(project);
  });

  it('retains locks, pooled contacts, fixed anchors and encoder ownership', () => {
    const project = getResultValue(parseProjectFile(locked));
    expect(project.wires[0]).toMatchObject({ locked: true, contactIds: [0] });
    const saved = getResultValue(serializeProject(project));
    expect(getResultValue(parseProjectFile(saved))).toEqual(project);
  });

  it('loads v13 with exactly the old geometry and no locks or routing regeneration', () => {
    const project = getResultValue(parseProjectFile(legacy));
    expect(project.schemaVersion).toBe(14);
    expect(project.wires.every((wire) => !('locked' in wire))).toBe(true);
    expect(project).not.toHaveProperty('routing');
    expect(project.wires[0]).toMatchObject({ id: 'w0', bends: [], contactIds: [0] });
    expect(project.encoders[0]).toMatchObject({ pushKeyId: 'k3' });
  });

  it.each([0, -0.1, Number.NaN, Number.POSITIVE_INFINITY, 0.00001])(
    'rejects an unusable clearance %s at its field',
    (clearanceU) => {
      expect(paths(file({ routing: { ...ROUTING, clearanceU } }))).toContain('routing.clearanceU');
    },
  );

  it('rejects unknown keys, wrong-half and duplicate key assignment references', () => {
    expect(
      paths(
        file({
          routing: { ...ROUTING, targetCells: [{ keyId: 'k9', half: 'left', row: 0, col: 0 }] },
        }),
      ),
    ).toContain('routing.targetCells.0.keyId');
    expect(
      paths(
        file({
          routing: { ...ROUTING, targetCells: [{ keyId: 'k0', half: 'right', row: 0, col: 0 }] },
        }),
      ),
    ).toContain('routing.targetCells.0.half');
    expect(
      paths(
        file({
          routing: { ...ROUTING, targetCells: [...ROUTING.targetCells, ...ROUTING.targetCells] },
        }),
      ),
    ).toContain('routing.targetCells.1.keyId');
  });

  it('exposes version 14 and the persisted lock/settings shapes in agent JSON schema', () => {
    expect(JSON.stringify(getProjectJsonSchema())).toContain('"const":14');
    expect(JSON.stringify(getProjectJsonSchema())).toContain('"locked"');
    expect(JSON.stringify(getProjectJsonSchema())).toContain('"routing"');
  });

  it('refuses a malformed lock rather than silently importing it unlocked', () => {
    const raw = file({
      wires: [
        {
          id: 'w0',
          start: { kind: 'free', at: { xU: 0, yU: 0 } },
          end: { kind: 'free', at: { xU: 1, yU: 0 } },
          bends: [],
          locked: false,
        },
      ],
    });
    expect(paths(raw)).toContain('wires.0.locked');
  });
});
