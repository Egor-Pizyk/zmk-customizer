import { getDefinedValue } from '../../tests/helpers/defined-value';
import { getResultValue } from '../../tests/helpers/result';
import type { Wire } from '../domain/types';
import { expect, it } from 'vitest';
import { createProject } from '../domain/create-project';
import { parseProjectFile } from './parse-project-file';
import { serializeProject } from './serialize-project';
import { migrateV4ToV5 } from './migrate-v4-to-v5';

const RAW_PINS = [8, 6, 17, 20, 22, 24, 11, 9, 10, 2, 29, 31];
const CONNECTOR_PINS = [0, 1, 2, 3, 4, 5, 7, 10, 16, 19, 20, 21];
function oldProject() {
  const { controllerId: _controllerId, ...project } = createProject();
  return {
    ...project,
    schemaVersion: 4,
    keys: RAW_PINS.map((_, index) => ({ id: `k${index}`, xU: index * 2, yU: 0 })),
    wires: RAW_PINS.map((boardPin, index) => ({
      id: `w${index}`,
      start: { kind: 'free', at: { xU: index * 2, yU: 0 }, boardPin },
      end: { kind: 'key-pin', keyId: `k${index}`, pin: 1 },
      bends: [],
    })),
  };
}
it('maps every exposed legacy raw pin to the same physical connector position', () => {
  const old = oldProject();
  const parsed = getResultValue(parseProjectFile(JSON.stringify(old)));
  expect(parsed.controllerId).toBe('nice_nano_v2');
  expect(parsed.schemaVersion).toBe(5);
  expect(parsed.wires.map((wire) => getStartBoardPin(wire))).toEqual(CONNECTOR_PINS);
  expect(parsed.wires.map((wire) => wire.end)).toEqual(old.wires.map((wire) => wire.end));
  expect(old.wires.map((wire) => wire.start.boardPin)).toEqual(RAW_PINS);
  const saved = serializeProject(parsed);
  expect(getResultValue(parseProjectFile(getResultValue(saved)))).toEqual(parsed);
});
it('retains unmappable valid old pins as actionable dropped labels', () => {
  const old = oldProject();
  const wire = getDefinedValue(old.wires[0]);
  const parsed = parseProjectFile(
    JSON.stringify({ ...old, wires: [{ ...wire, start: { ...wire.start, boardPin: 13 } }] }),
  );
  expect(getResultValue(parsed).wires[0]?.start).toEqual({
    kind: 'free',
    at: wire.start.at,
    droppedBoardPin: 'nice!nano v2 P13',
  });
});
it.each([null, -1, 32, 2.5, '8'])('rejects malformed legacy boardPin %j', (boardPin) => {
  const old = oldProject();
  const wire = getDefinedValue(old.wires[0]);
  expect(
    parseProjectFile(
      JSON.stringify({ ...old, wires: [{ ...wire, start: { ...wire.start, boardPin } }] }),
    ).ok,
  ).toBe(false);
});
it('does not legitimize newly introduced fields in old files', () => {
  expect(parseProjectFile(JSON.stringify({ ...oldProject(), controllerId: 'bogus' })).ok).toBe(
    false,
  );
  const old = oldProject();
  const wire = getDefinedValue(old.wires[0]);
  expect(
    parseProjectFile(
      JSON.stringify({
        ...old,
        wires: [{ ...wire, start: { ...wire.start, droppedBoardPin: 'bad' } }],
      }),
    ).ok,
  ).toBe(false);
  expect(migrateV4ToV5(null)).toBeNull();
});
it('rejects unknown controller ids and conflicting or malformed drop metadata in v5', () => {
  expect(parseProjectFile(JSON.stringify({ ...createProject(), controllerId: 'bogus' })).ok).toBe(
    false,
  );
  for (const droppedBoardPin of ['', null, 42, 'x'.repeat(161)]) {
    expect(
      parseProjectFile(
        JSON.stringify({
          ...createProject(),
          keys: [{ id: 'k0', xU: 0, yU: 0 }],
          wires: [
            {
              id: 'w0',
              start: { kind: 'free', at: { xU: 0, yU: 0 }, droppedBoardPin },
              end: { kind: 'key-pin', keyId: 'k0', pin: 1 },
              bends: [],
            },
          ],
        }),
      ).ok,
    ).toBe(false);
  }
  expect(
    parseProjectFile(
      JSON.stringify({
        ...createProject(),
        keys: [{ id: 'k0', xU: 0, yU: 0 }],
        wires: [
          {
            id: 'w0',
            start: { kind: 'free', at: { xU: 0, yU: 0 }, boardPin: 0, droppedBoardPin: 'old' },
            end: { kind: 'key-pin', keyId: 'k0', pin: 1 },
            bends: [],
          },
        ],
      }),
    ).ok,
  ).toBe(false);
});

function getStartBoardPin(wire: Wire) {
  return wire.start.kind === 'free' ? wire.start.boardPin : undefined;
}

it.each([2, 3])('loads v%s through the whole chain preserving existing content', (version) => {
  const old = oldProject();
  const parsed = getResultValue(
    parseProjectFile(JSON.stringify({ ...old, schemaVersion: version })),
  );
  expect(parsed.keys).toEqual(old.keys);
  expect(parsed.wires.map((wire) => getStartBoardPin(wire))).toEqual(CONNECTOR_PINS);
  expect(parsed.wires.map((wire) => wire.end)).toEqual(old.wires.map((wire) => wire.end));
  expect(parsed.wires.map((wire) => wire.bends)).toEqual(old.wires.map((wire) => wire.bends));
  expect(parsed.layers).toEqual(old.layers);
  expect(parsed.insulatedCrossings).toEqual(old.insulatedCrossings);
});
it('loads v1 as an empty schematic with the default controller', () => {
  const parsed = getResultValue(
    parseProjectFile(JSON.stringify({ schemaVersion: 1, name: 'old' })),
  );
  expect(parsed.keys).toEqual([]);
  expect(parsed.wires).toEqual([]);
  expect(parsed.controllerId).toBe('nice_nano_v2');
});
