import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../tests/helpers/build-project';
import { getWirePath } from '../../domain/get-wire-path';
import { getSchematicGeometry } from './get-schematic-geometry';

it.each([
  { x: 2, y: 0.3667, angle: 0, frontX: 0.62, frontY: 0.3667 },
  { x: -2, y: 0.3667, angle: 180, frontX: -0.02, frontY: 0.3667 },
  { x: 0.3, y: 2, angle: 90, frontX: 0.3, frontY: 0.6867 },
  { x: 0.3, y: -2, angle: -90, frontX: 0.3, frontY: 0.0467 },
])(
  'anchors the back to the pin and front to the wire towards $x,$y',
  ({ x, y, angle, frontX, frontY }) => {
    const wire = { id: 'w0', start: keyPin('k0', 1), end: freeEnd(x, y, 2), bends: [] };
    for (const cathode of ['away-switch', 'toward-switch'] as const) {
      const project = buildProject({
        keys: [{ id: 'k0', xU: 0, yU: 0, diode: { pin: 1, cathode } }],
        wires: [wire],
      });
      const before = structuredClone(project);
      const geometry = getSchematicGeometry(project);
      expect(geometry.diodes.get('k0')).toEqual({
        at: { xU: 0.3, yU: 0.3667 },
        terminal: { xU: frontX, yU: frontY },
        angle,
      });
      expect(geometry.paths.get('w0')?.[0]).toEqual({ xU: frontX, yU: frontY });
      expect(getWirePath(project, wire)[0]).toEqual({ xU: 0.3, yU: 0.3667 });
      expect(project).toEqual(before);
    }
  },
);

it('connects multiple wires to one external terminal and handles reversed endpoints', () => {
  const project = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0, diode: { pin: 2, cathode: 'away-switch' } }],
    wires: [
      { id: 'w0', start: freeEnd(2, 0.2333), end: keyPin('k0', 2), bends: [] },
      { id: 'w1', start: keyPin('k0', 2), end: freeEnd(0.6333, -2), bends: [] },
    ],
  });
  const geometry = getSchematicGeometry(project);
  expect(geometry.paths.get('w0')?.at(-1)).toEqual({ xU: 0.9533, yU: 0.2333 });
  expect(geometry.paths.get('w1')?.[0]).toEqual({ xU: 0.9533, yU: 0.2333 });
});

it('restores the original drawing when a diode is removed and defaults an unwired diode upward', () => {
  const wire = { id: 'w0', start: keyPin('k0', 1), end: freeEnd(2, 0.3667), bends: [] };
  const plain = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }], wires: [wire] });
  expect(getSchematicGeometry(plain).paths.get('w0')).toEqual(getWirePath(plain, wire));
  const unwired = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } }],
  });
  expect(getSchematicGeometry(unwired).diodes.get('k0')?.terminal).toEqual({ xU: 0.3, yU: 0.0467 });
});

it('ignores a tiny automatic elbow and faces along the outgoing wire run', () => {
  const project = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } }],
    wires: [
      { id: 'w0', start: keyPin('k0', 1), end: freeEnd(0.25, -1), bends: [{ xU: 0.25, yU: -0.5 }] },
    ],
  });
  const geometry = getSchematicGeometry(project);
  expect(geometry.diodes.get('k0')?.angle).toBe(-90);
  expect(geometry.paths.get('w0')?.[0]).toEqual({ xU: 0.3, yU: 0.0467 });
});

it('prefers the rightward row branch over earlier leftward or vertical wires', () => {
  const keys = [0, 1, 2].map((index) => ({
    id: `k${index}`,
    xU: index * 2,
    yU: 0,
    diode: { pin: 1, cathode: 'away-switch' } as const,
  }));
  const project = buildProject({
    keys,
    wires: [
      { id: 'vertical', start: keyPin('k1', 1), end: freeEnd(2.3, -2), bends: [] },
      { id: 'left', start: keyPin('k0', 1), end: keyPin('k1', 1), bends: [] },
      { id: 'right', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [] },
      { id: 'controller', start: keyPin('k2', 1), end: freeEnd(6, 0.3667, 9), bends: [] },
    ],
  });
  const before = structuredClone(project);
  for (const wires of [project.wires, project.wires.toReversed()]) {
    const geometry = getSchematicGeometry({ ...project, wires });
    expect(keys.map((key) => geometry.diodes.get(key.id)?.angle)).toEqual([0, 0, 0]);
  }
  expect(project).toEqual(before);
});

it('orients a middle diode along a row passing through its pin without an explicit endpoint', () => {
  const project = buildProject({
    keys: [0, 1, 2].map((index) => ({
      id: `k${index}`,
      xU: index * 2,
      yU: 0,
      diode: { pin: 1, cathode: 'away-switch' } as const,
    })),
    wires: [{ id: 'row', start: keyPin('k0', 1), end: freeEnd(6, 0.3667, 9), bends: [] }],
  });
  const geometry = getSchematicGeometry(project);
  expect(geometry.diodes.get('k1')?.angle).toBe(0);
  expect(geometry.diodes.get('k2')?.angle).toBe(0);
});
