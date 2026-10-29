import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { prettifyWiring, regenerateWiring } from '@domain/wiring/editing';
import type { WiringScope } from '@domain/wiring/editing';
import { getRoutingSettings } from '@domain/wiring';
import { getElectricalRelations } from '@domain/wires/nets';
import { getWirePath } from '@domain/wires/geometry';
import type { Project, Wire } from '@domain';
import { buildProject } from '../../../../helpers/build-project';
import { getResultValue } from '../../../../helpers/result';

it('removes redundant nodes from generated matrix buses without treating them as electrical sites', () => {
  const clean = matrix();
  const source = { ...clean, wires: clean.wires.map(subdivide) };
  expect(getElectricalRelations(source)).toEqual(getElectricalRelations(clean));
  const result = getResultValue(
    prettifyWiring(source, {
      settings: getRoutingSettings(source),
      scope: { kind: 'all' },
      limits: ZMK_LIMITS,
    }),
  ).project;
  expect(result.wires).toEqual(clean.wires);
  expect(getElectricalRelations(result)).toEqual(getElectricalRelations(source));
});

function matrix(): Project {
  const base = buildProject({
    keys: Array.from({ length: 9 }, (_, i) => ({
      id: `k${i}`,
      xU: i % 3,
      yU: Math.floor(i / 3),
    })),
  });
  return getResultValue(
    regenerateWiring(base, {
      board: getControllerBoard(base.controllerId),
      limits: ZMK_LIMITS,
      settings: getRoutingSettings(base),
      scope: { kind: 'all' },
    }),
  ).project;
}
function subdivide(wire: Wire): Wire {
  const path = getWirePath(matrixProject, wire);
  return {
    ...wire,
    bends: path
      .slice(1)
      .flatMap((to, index) => {
        const from = path[index] ?? to;
        return [{ xU: (from.xU + to.xU) / 2, yU: (from.yU + to.yU) / 2 }, to];
      })
      .slice(0, -1),
  };
}
const matrixProject = matrix();

it('removes mutually obstructing editable detours together while keeping isolated circuits', () => {
  const source = obstructingDetours();
  const result = getResultValue(
    prettifyWiring(source, {
      settings: getRoutingSettings(source),
      scope: { kind: 'all' },
      limits: ZMK_LIMITS,
    }),
  ).project;
  expect(result.wires.map((wire) => wire.bends)).toEqual([[], []]);
  expect(result.insulatedCrossings).toEqual([{ wireIds: ['w0', 'w1'], ordinal: 0 }]);
  expect(getElectricalRelations(result)).toEqual(getElectricalRelations(source));
  expect(
    getResultValue(
      prettifyWiring(result, {
        settings: getRoutingSettings(result),
        scope: { kind: 'all' },
        limits: ZMK_LIMITS,
      }),
    ).project,
  ).toBe(result);
});

function obstructingDetours(): Project {
  return buildProject({
    wires: [
      {
        id: 'w0',
        start: { kind: 'free', at: { xU: 0, yU: 0 } },
        end: { kind: 'free', at: { xU: 4, yU: 0 } },
        bends: [
          { xU: 0, yU: 2 },
          { xU: 4, yU: 2 },
        ],
      },
      {
        id: 'w1',
        start: { kind: 'free', at: { xU: 2, yU: -1 } },
        end: { kind: 'free', at: { xU: 2, yU: 1 } },
        bends: [
          { xU: 0.05, yU: -1 },
          { xU: 0.05, yU: 0.05 },
          { xU: 1, yU: 0.05 },
          { xU: 1, yU: 1 },
        ],
      },
    ],
  });
}

for (const mode of ['locked', 'outside'] as const) {
  it(`retains a ${mode} obstruction instead of relaxing its protection`, () => {
    const source = fixedObstruction(mode);
    const before = JSON.stringify(source);
    const result = prettifyWiring(source, {
      settings: getRoutingSettings(source),
      limits: ZMK_LIMITS,
      scope: obstructionScope(mode),
    });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(source)).toBe(before);
  });
}
function fixedObstruction(mode: 'locked' | 'outside'): Project {
  const source = obstructingDetours();
  return {
    ...source,
    wires: source.wires.map((wire) => protectWire(wire, mode)),
  };
}

function protectWire(wire: Wire, mode: 'locked' | 'outside'): Wire {
  return mode === 'locked' && wire.id === 'w1' ? { ...wire, locked: true } : wire;
}
function obstructionScope(mode: 'locked' | 'outside'): WiringScope {
  return mode === 'locked' ? { kind: 'all' } : { kind: 'selection', netWireIds: ['w0'] };
}
