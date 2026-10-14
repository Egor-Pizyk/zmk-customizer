import { findBoardPinUser } from '@domain/wires';
import { buildWiringProject } from '../../../helpers/wiring-project';
import { getDefinedValue } from '../../../helpers/defined-value';
import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

const PROJECT = buildProject({
  keys: [{ id: 'k1', xU: 0, yU: 0 }],
  wires: [
    { id: 'w1', start: keyPin('k1', 1), end: freeEnd(0, 3, 4), bends: [] },
    { id: 'w2', start: keyPin('k1', 2), end: freeEnd(1, 3), bends: [] },
  ],
});

it('names the wire whose free end already uses a board pin', () => {
  expect(findBoardPinUser(PROJECT, { boardPin: 4, except: { wireId: 'w2', side: 'end' } })).toBe(0);
});

it('ignores the asking end itself and unused pins', () => {
  expect(
    findBoardPinUser(PROJECT, { boardPin: 4, except: { wireId: 'w1', side: 'end' } }),
  ).toBeUndefined();
  expect(
    findBoardPinUser(PROJECT, { boardPin: 5, except: { wireId: 'w2', side: 'end' } }),
  ).toBeUndefined();
});

it('resolves shared terminal GPIOs and ignores the same bus or the other split half', () => {
  const project = buildWiringProject('direct', 'split');
  const first = getDefinedValue(project.wires.find(hasFirstInput));
  expect(
    findBoardPinUser(project, { boardPin: 0, except: { wireId: first.id, side: 'end' } }),
  ).toBeUndefined();
  expect(
    findBoardPinUser(project, { boardPin: 1, except: { wireId: first.id, side: 'end' } }),
  ).toBe(2);
});

function hasFirstInput(wire: (typeof PROJECT.wires)[number]) {
  return wire.end.kind === 'free' && wire.end.terminalId === 't5';
}
