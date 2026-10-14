import { findWireContacts } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import { getWireHalf } from '@domain/wiring';
import type { Wire } from '@domain';

import { expect, it } from 'vitest';
import { buildProject, freeEnd } from '../../../helpers/build-project';

it('inherits the right half through junction branches and terminates on cycles', () => {
  const root: Wire = {
    id: 'w0',
    start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
    end: freeEnd(0, 0),
    bends: [],
  };
  const branch: Wire = {
    id: 'w1',
    start: { kind: 'junction', wireId: 'w0', at: { xU: 0, yU: 0 } },
    end: freeEnd(1, 0),
    bends: [],
  };
  const project = {
    ...buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }], wires: [root, branch] }),
    wiring: {
      kind: 'matrix' as const,
      topology: 'split' as const,
      diodeDirection: 'col2row' as const,
      terminals: [],
    },
  };
  expect(
    getWireHalf(
      { ...project, keys: project.keys.map((key) => ({ ...key, half: 'right' })) },
      branch,
    ),
  ).toBe('right');
  const cycle: Wire = { ...root, start: { kind: 'junction', wireId: 'w1', at: { xU: 0, yU: 0 } } };
  expect(getWireHalf({ ...project, wires: [cycle, branch] }, branch)).toBe('left');
});

it('includes actual right-half crossings on junction-only branches', () => {
  const root: Wire = {
    id: 'w0',
    start: { kind: 'free', at: { xU: -1, yU: 0 }, terminalId: 't0' },
    end: freeEnd(0, 0),
    bends: [],
  };
  const branch: Wire = {
    id: 'w1',
    start: { kind: 'junction', wireId: 'w0', at: { xU: 0, yU: 0 } },
    end: freeEnd(4, 0),
    bends: [],
  };
  const bus: Wire = {
    id: 'w2',
    start: { kind: 'free', at: { xU: 2, yU: -2 }, terminalId: 't1' },
    end: freeEnd(2, 2),
    bends: [],
  };
  const project = {
    ...buildProject({ wires: [root, branch, bus] }),
    wiring: {
      kind: 'matrix' as const,
      topology: 'split' as const,
      diodeDirection: 'col2row' as const,
      terminals: [
        { id: 't0', half: 'right' as const, kind: 'row' as const },
        { id: 't1', half: 'right' as const, kind: 'col' as const },
      ],
    },
  };
  expect(findWireContacts(project).crossings.map((crossing) => crossing.wireIds)).toContainEqual([
    'w1',
    'w2',
  ]);
  expect(getNets(project).map((net) => net.terminalIds)).toContainEqual(['t0', 't1']);
});

it('keeps legacy and unibody geometric contacts in one controller namespace', () => {
  const wire: Wire = {
    id: 'w0',
    start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
    end: freeEnd(0, 0),
    bends: [],
  };
  const project = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0, half: 'right' }],
    wires: [wire],
  });
  expect(getWireHalf(project, wire)).toBe('left');
  expect(
    getWireHalf(
      {
        ...project,
        wiring: { kind: 'matrix', topology: 'unibody', diodeDirection: 'col2row', terminals: [] },
      },
      wire,
    ),
  ).toBe('left');
});
