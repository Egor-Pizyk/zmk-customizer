import { expect, it } from 'vitest';
import { createBoardPinUserLookup } from '@domain/wires';
import type { Project } from '@domain';
import { buildProject, freeEnd } from '../../../helpers/build-project';

it('retains first-user order, opposite ends, half namespaces and shared-terminal exclusions', () => {
  const project: Project = {
    ...buildProject({
      wires: [
        {
          id: 'w0',
          half: 'left',
          start: { kind: 'free', at: { xU: 0, yU: 0 }, terminalId: 't0' },
          end: freeEnd(1, 0, 2),
          bends: [],
        },
        {
          id: 'w1',
          half: 'left',
          start: { kind: 'free', at: { xU: 0, yU: 1 }, terminalId: 't0' },
          end: freeEnd(1, 1),
          bends: [],
        },
        { id: 'w2', half: 'right', start: freeEnd(0, 2, 2), end: freeEnd(1, 2), bends: [] },
        { id: 'w3', half: 'left', start: freeEnd(0, 3, 2), end: freeEnd(1, 3), bends: [] },
      ],
    }),
    wiring: {
      kind: 'matrix',
      topology: 'split',
      diodeDirection: 'col2row',
      terminals: [{ id: 't0', kind: 'row', half: 'left', boardPin: 2 }],
    },
  };
  const lookup = createBoardPinUserLookup(project);
  expect(lookup({ boardPin: 2, except: { wireId: 'w0', side: 'start' } })).toBe(0);
  expect(lookup({ boardPin: 2, except: { wireId: 'w0', side: 'end' } })).toBe(0);
  expect(lookup({ boardPin: 2, except: { wireId: 'w1', side: 'start' } })).toBe(0);
  expect(lookup({ boardPin: 2, except: { wireId: 'w2', side: 'start' } })).toBeUndefined();
  expect(lookup({ boardPin: 3, except: { wireId: 'w0', side: 'start' } })).toBeUndefined();
  expect(lookup({ boardPin: 2, except: { wireId: 'missing', side: 'start' } })).toBe(0);
  expect(project.wires[0]?.start).toEqual({ kind: 'free', at: { xU: 0, yU: 0 }, terminalId: 't0' });
});

it('skips every end of the same terminal and respects raw pins only when no terminal pin exists', () => {
  const project: Project = {
    ...buildProject({
      wires: [
        {
          id: 'w0',
          start: { kind: 'free', at: { xU: 0, yU: 0 }, terminalId: 't0', boardPin: 7 },
          end: freeEnd(1, 0),
          bends: [],
        },
        {
          id: 'w1',
          start: { kind: 'free', at: { xU: 0, yU: 1 }, terminalId: 't0' },
          end: freeEnd(1, 1),
          bends: [],
        },
        {
          id: 'w2',
          start: { kind: 'free', at: { xU: 0, yU: 2 }, terminalId: 't1', boardPin: 7 },
          end: freeEnd(1, 2),
          bends: [],
        },
      ],
    }),
    wiring: {
      kind: 'matrix',
      topology: 'unibody',
      diodeDirection: 'col2row',
      terminals: [
        { id: 't0', kind: 'row', half: 'left', boardPin: 2 },
        { id: 't1', kind: 'col', half: 'left' },
      ],
    },
  };
  const lookup = createBoardPinUserLookup(project);
  expect(lookup({ boardPin: 2, except: { wireId: 'w0', side: 'start' } })).toBeUndefined();
  expect(lookup({ boardPin: 2, except: { wireId: 'w1', side: 'start' } })).toBeUndefined();
  expect(lookup({ boardPin: 7, except: { wireId: 'w0', side: 'start' } })).toBe(2);
  expect(lookup({ boardPin: 7, except: { wireId: 'w2', side: 'start' } })).toBeUndefined();
});
