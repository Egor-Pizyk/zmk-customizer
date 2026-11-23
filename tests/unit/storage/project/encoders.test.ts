import { getResultValue } from '../../../helpers/result';
import { expect, it } from 'vitest';
import { parseProjectFile, serializeProject } from '@storage/project';
import { createProject } from '@domain/project';
import legacy from '../../../fixtures/project/v10-encoders-legacy.json?raw';

it('migrates historical v10 without changing its content and round trips encoder data', () => {
  const parsed = { value: getResultValue(parseProjectFile(legacy)) };
  expect(parsed.value).toEqual({ ...JSON.parse(legacy), schemaVersion: 14, encoders: [] });
  const project = {
    ...parsed.value,
    encoders: [
      {
        id: 'e1',
        xU: 5,
        yU: -2,
        half: 'left',
        aPin: 20,
        bPin: 21,
        steps: 80,
        triggersPerRotation: 20,
      },
    ] as const,
    layers: [
      {
        id: 'l0',
        name: 'Base',
        bindings: {},
        encoderBindings: {
          e1: {
            clockwise: { kind: 'kp', key: { keycode: 'C_VOL_UP', modifiers: [] } },
            counterclockwise: { kind: 'none' },
          },
        },
      } as const,
    ],
  };
  expect(parseProjectFile(getResultValue(serializeProject(project)))).toEqual({
    ok: true,
    value: project,
  });
});
it('rejects malformed, oversized, duplicate and dangling encoder structures', () => {
  const project = createProject({ controllerId: 'nice_nano_v2' });
  const encoder = { id: 'e1', xU: 0, yU: 0, half: 'left', steps: 80, triggersPerRotation: 20 };
  for (const encoders of [
    [{ ...encoder, aPin: '20' }],
    [{ ...encoder, extra: true }],
    [encoder, encoder],
    Array.from({ length: 17 }, (_, index) => ({ ...encoder, id: `e${index}` })),
  ]) {
    expect(parseProjectFile(JSON.stringify({ ...project, encoders })).ok).toBe(false);
  }
  expect(
    parseProjectFile(
      JSON.stringify({
        ...project,
        layers: [
          {
            id: 'l0',
            name: 'Base',
            bindings: {},
            encoderBindings: {
              e9: { clockwise: { kind: 'none' }, counterclockwise: { kind: 'none' } },
            },
          },
        ],
      }),
    ).ok,
  ).toBe(false);
});
it('keeps semantic count and GPIO errors repairable on import', () => {
  const project = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    encoders: [
      {
        id: 'e1',
        xU: 999,
        yU: 0,
        half: 'right',
        aPin: 11,
        bPin: 11,
        steps: -1,
        triggersPerRotation: 0.5,
      },
    ],
  };
  expect(parseProjectFile(JSON.stringify(project)).ok).toBe(true);
});
