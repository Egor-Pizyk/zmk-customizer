import { expect, it } from 'vitest';
import { createProject } from '@domain/project';
import { parseProjectFile, serializeProject } from '@storage/project';
import { getResultValue } from '../../../helpers/result';

const encoder = {
  id: 'e1',
  xU: 0,
  yU: 0,
  half: 'left',
  steps: 80,
  triggersPerRotation: 20,
} as const;
function schematicProject() {
  return {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    schemaVersion: 13,
    keys: [{ id: 'k1', xU: 0, yU: 0 }],
    encoders: [{ ...encoder, rotationDeg: 35, wiringMode: 'schematic', pushKeyId: 'k1' }],
    wires: [
      {
        id: 'w1',
        start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'COM' },
        end: { kind: 'free', at: { xU: -1, yU: 0 }, ground: true },
        bends: [],
      },
    ],
  } as const;
}
it('round trips schematic contacts, ground and an ordinary push key', () => {
  const project = schematicProject();
  expect(getResultValue(parseProjectFile(JSON.stringify(project)))).toEqual(project);
  expect(getResultValue(parseProjectFile(getResultValue(serializeProject(project))))).toEqual(
    project,
  );
});
it('migrates v12 encoders without adding schematic mode or a button', () => {
  const project = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    schemaVersion: 12,
    encoders: [{ ...encoder, aPin: 20, bPin: 21 }],
  };
  expect(getResultValue(parseProjectFile(JSON.stringify(project)))).toEqual({
    ...project,
    schemaVersion: 13,
  });
});
it('rejects missing contacts, dangling push keys and duplicate push ownership', () => {
  const project = schematicProject();
  const wire = project.wires[0];
  for (const patch of [
    { wires: [{ ...wire, start: { ...wire.start, encoderId: 'e99' } }] },
    { wires: [{ ...wire, start: { ...wire.start, pin: 'D' } }] },
    { encoders: [{ ...project.encoders[0], pushKeyId: 'k99' }] },
    { encoders: [...project.encoders, { ...project.encoders[0], id: 'e2' }] },
  ]) {
    expect(parseProjectFile(JSON.stringify({ ...project, ...patch })).ok).toBe(false);
  }
});
it('rejects ground combined with another free-end assignment', () => {
  const project = schematicProject();
  for (const assignment of [{ boardPin: 1 }, { terminalId: 't1' }, { droppedBoardPin: 'P1' }]) {
    expect(
      parseProjectFile(
        JSON.stringify({
          ...project,
          wires: [{ ...project.wires[0], end: { ...project.wires[0].end, ...assignment } }],
        }),
      ).ok,
    ).toBe(false);
  }
});
it('rejects v13-only fields in v12 before migrating contacts', () => {
  const project = schematicProject();
  expect(parseProjectFile(JSON.stringify({ ...project, schemaVersion: 12 })).ok).toBe(false);
  expect(parseProjectFile(JSON.stringify({ ...project, schemaVersion: 12, wires: [] })).ok).toBe(
    false,
  );
});
it('validates legacy v12 references before migration', () => {
  const base = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    schemaVersion: 12,
    keys: [{ id: 'k1', xU: 0, yU: 0 }],
    encoders: [encoder],
  } as const;
  const invalid = [
    { keys: [...base.keys, base.keys[0]] },
    {
      wires: [
        {
          id: 'w1',
          start: { kind: 'key-pin', keyId: 'k99', pin: 1 },
          end: { kind: 'free', at: { xU: 1, yU: 1 } },
          bends: [],
        },
      ],
    },
    {
      wires: [
        {
          id: 'w1',
          start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
          end: { kind: 'key-pin', keyId: 'k1', pin: 1 },
          bends: [],
        },
      ],
    },
    { layers: [{ ...base.layers[0], bindings: { k99: { kind: 'none' } } }] },
    {
      layers: [
        {
          ...base.layers[0],
          encoderBindings: {
            e99: { clockwise: { kind: 'none' }, counterclockwise: { kind: 'none' } },
          },
        },
      ],
    },
  ] as const;
  for (const patch of invalid) {
    expect(parseProjectFile(JSON.stringify({ ...base, ...patch })).ok).toBe(false);
  }
});
