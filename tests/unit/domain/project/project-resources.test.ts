import { createProject, getProjectResourceError } from '@domain/project';
import { serializeProject, parseProjectFile } from '@storage/project';
import type { Project, Wire } from '@domain';
import { getDefinedValue } from '../../../helpers/defined-value';
import { getResultValue } from '../../../helpers/result';
import { expect, it } from 'vitest';

const base = {
  ...createProject({ controllerId: 'nice_nano_v2' }),
  keys: [{ id: 'k1', xU: 0, yU: 0 }],
};
function wires(count: number, bends = 0, start = 0): Wire[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `w${index + start}`,
    start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
    end: { kind: 'free', at: { xU: 2, yU: 2 } },
    bends: Array.from({ length: bends }, () => ({ xU: 1, yU: 1 })),
  }));
}
it.each([
  { name: 'wires', accepted: { wires: wires(600) }, rejected: { wires: wires(601) } },
  { name: 'bends', accepted: { wires: wires(1, 64) }, rejected: { wires: wires(1, 65) } },
  { name: 'segments', accepted: { wires: wires(23, 64) }, rejected: { wires: wires(24, 64) } },
  { name: 'text', accepted: { name: 'x'.repeat(4096) }, rejected: { name: 'x'.repeat(4097) } },
  {
    name: 'ID',
    accepted: { keys: [{ id: `k${'9'.repeat(127)}`, xU: 0, yU: 0 }] },
    rejected: { keys: [{ id: `k${'9'.repeat(128)}`, xU: 0, yU: 0 }] },
  },
])(
  'keeps accepted $name resources saveable and diagnoses the first excess',
  ({ accepted, rejected }) => {
    const project = { ...base, ...accepted };
    expect(getProjectResourceError(project)).toBeUndefined();
    const saved = serializeProject(project);
    expect(saved.ok).toBe(true);
    expect(parseProjectFile(getResultValue(saved))).toEqual({ ok: true, value: project });
    expect(getProjectResourceError({ ...base, ...rejected })).toBeTypeOf('string');
  },
);
it('counts pretty JSON, newline and UTF-8 bytes just like the saved artifact', () => {
  const layers = Array.from({ length: 64 }, (_, index) => ({
    id: `l${index}`,
    name: 'Layer',
    bindings: Object.fromEntries(
      Array.from({ length: 512 }, (_entry, keyIndex) => [
        `k${keyIndex}`,
        { kind: 'kp' as const, key: { keycode: 'é'.repeat(50), modifiers: [] } },
      ]),
    ),
  }));
  const project: Project = {
    ...base,
    keys: Array.from({ length: 512 }, (_, index) => ({ id: `k${index}`, xU: index, yU: 0 })),
    layers,
  };
  expect(getProjectResourceError(project)).toContain('byte budget');
  expect(serializeProject(project).ok).toBe(false);
});
it('checks remaining collection budgets and nested string fields', () => {
  expect(
    getProjectResourceError({
      ...base,
      keys: Array.from({ length: 513 }, (_, index) => ({ id: `k${index}`, xU: 0, yU: 0 })),
    }),
  ).toContain('512 keys');
  expect(
    getProjectResourceError({
      ...base,
      layers: Array.from({ length: 65 }, (_, index) => ({
        id: `l${index}`,
        name: 'Layer',
        bindings: {},
      })),
    }),
  ).toContain('64 layers');
  expect(
    getProjectResourceError({
      ...base,
      insulatedCrossings: Array.from({ length: 8193 }, () => ({
        wireIds: ['w0', 'w1'] as const,
        ordinal: 0,
      })),
    }),
  ).toContain('8192');
  expect(
    getProjectResourceError({
      ...base,
      layers: [
        {
          id: 'l0',
          name: 'Base',
          bindings: {
            k1: {
              kind: 'tap_dance',
              tappingTermMs: 200,
              taps: Array.from({ length: 65 }, () => ({ keycode: 'A', modifiers: [] })),
            },
          },
        },
      ],
    }),
  ).toContain('64 taps');
  expect(
    getProjectResourceError({
      ...base,
      layers: [
        {
          id: 'l0',
          name: 'Base',
          bindings: Object.fromEntries(
            Array.from({ length: 513 }, (_, index) => [`k${index}`, { kind: 'none' as const }]),
          ),
        },
      ],
    }),
  ).toContain('512 bindings');
  expect(
    getProjectResourceError({
      ...base,
      wires: [
        {
          ...wires(1)[0],
          id: 'w0',
          start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
          end: { kind: 'free', at: { xU: 0, yU: 0 }, droppedBoardPin: 'x'.repeat(161) },
          bends: [],
        },
      ],
    }),
  ).toContain('160 characters');
});

it('accepts exactly 3000 segments and rejects the next bend', () => {
  const exact = { ...base, wires: [...wires(300, 1), ...wires(300, 2, 300)] };
  expect(getProjectResourceError(exact)).toBeUndefined();
  expect(serializeProject(exact).ok).toBe(true);
  const first = getDefinedValue(exact.wires[0]);
  const excess = {
    ...exact,
    wires: [{ ...first, bends: [...first.bends, { xU: 2, yU: 2 }] }, ...exact.wires.slice(1)],
  };
  expect(getProjectResourceError(excess)).toContain('3000 wire segments');
});
