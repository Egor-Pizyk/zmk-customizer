import { ENCODER_DEFAULTS } from '@catalog/encoders';
import { addLayer, removeLayer } from '@domain/layers';
import { describe, expect, it } from 'vitest';
import {
  addEncoder,
  replaceEncoder,
  removeEncoder,
  setEncoderBinding,
  validateEncoders,
} from '@domain/encoders';
import { changeController, createProject, getProjectResourceError } from '@domain/project';
import { getControllerBoard, CONTROLLER_BOARDS } from '@catalog/controllers';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';
import type { Project, Encoder, Binding } from '@domain';

const board = getControllerBoard('nice_nano_v2');
const encoder: Encoder = {
  id: 'e1',
  xU: 6,
  yU: 0,
  half: 'left',
  aPin: 20,
  bPin: 21,
  steps: 80,
  triggersPerRotation: 20,
};
const kp: Binding = { kind: 'kp', key: { keycode: 'C_VOL_UP', modifiers: [] } };
const input = { board, catalog: BINDINGS_CATALOG };
function project(): Project {
  return { ...UNIBODY_PRESET, encoders: [encoder] };
}

describe('encoder hardware and stable layer actions', () => {
  it('adds deterministic identities and defaults without changing an immutable input', () => {
    const before = createProject({ controllerId: board.id });
    Object.freeze(before);
    const added = addEncoder(before, ENCODER_DEFAULTS);
    expect(before.encoders).toEqual([]);
    expect(added.encoders).toEqual([
      { id: 'e1', xU: 0, yU: 0, half: 'left', steps: 80, triggersPerRotation: 20 },
    ]);
    expect(addEncoder(added, ENCODER_DEFAULTS).encoders[1]).toMatchObject({ id: 'e2', xU: 2 });
    expect(added.keys).toBe(before.keys);
    expect(added.layers).toBe(before.layers);
  });
  it('preserves independent actions through key and layer order, deletes only the encoder mappings', () => {
    const before = project();
    const first = setEncoderBinding(before, {
      layerId: 'l0',
      encoderId: 'e1',
      direction: 'clockwise',
      binding: kp,
    });
    const second = setEncoderBinding(first, {
      layerId: 'l1',
      encoderId: 'e1',
      direction: 'counterclockwise',
      binding: { kind: 'mo', layerId: 'l0' },
    });
    expect(second.layers[0]?.encoderBindings?.['e1']).toEqual({
      clockwise: kp,
      counterclockwise: { kind: 'none' },
    });
    expect(second.layers[1]?.encoderBindings?.['e1']?.clockwise).toEqual({ kind: 'none' });
    const reordered = {
      ...second,
      keys: second.keys.toReversed(),
      layers: second.layers.toReversed(),
    };
    expect(reordered.layers.find((layer) => layer.id === 'l0')?.encoderBindings).toEqual(
      second.layers[0]?.encoderBindings,
    );
    const removed = removeEncoder(second, 'e1');
    expect(removed.encoders).toEqual([]);
    expect(removed.layers.every((layer) => layer.encoderBindings === undefined)).toBe(true);
    expect(removed.layers.map((layer) => layer.bindings)).toEqual(
      before.layers.map((layer) => layer.bindings),
    );
    expect(second.encoders).toEqual([encoder]);
    expect(removeEncoder(second, 'missing')).toBe(second);
    expect(replaceEncoder(second, { ...encoder, steps: 40 }).encoders[0]?.steps).toBe(40);
    expect(replaceEncoder(second, { ...encoder, id: 'missing' })).toBe(second);
    expect(
      setEncoderBinding(second, {
        layerId: 'missing',
        encoderId: 'e1',
        direction: 'clockwise',
        binding: kp,
      }),
    ).toBe(second);
  });
  it('reports missing pins, invalid counts, positions, half and collisions with channels/wiring', () => {
    const issues = validateEncoders(
      {
        ...project(),
        encoders: [
          {
            ...encoder,
            aPin: 2,
            bPin: 2,
            steps: 0,
            triggersPerRotation: 1.5,
            xU: 500,
            half: 'right',
          },
        ],
      },
      input,
    );
    expect(issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining([
        'encoders.0.steps',
        'encoders.0.triggersPerRotation',
        'encoders.0.xU',
        'encoders.0.half',
        'encoders.0.aPin',
        'encoders.0.bPin',
      ]),
    );
    expect(
      validateEncoders(
        {
          ...project(),
          encoders: [
            { id: 'e1', xU: 0, yU: 0, half: 'left', steps: 80, triggersPerRotation: 20, aPin: 11 },
          ],
        },
        input,
      ).map((issue) => issue.path.at(-1)),
    ).toEqual(expect.arrayContaining(['aPin', 'bPin']));
    expect(validateEncoders(project(), input)).toEqual([]);
    expect(
      validateEncoders(
        { ...project(), encoders: [encoder, { ...encoder, id: 'e2' }] },
        input,
      ).filter((issue) => issue.code === 'encoder-pin-conflict'),
    ).toHaveLength(4);
  });
  it('detects same-half switch terminal pins and allows equal pins on opposite split halves', () => {
    const base = project();
    const split: Project = {
      ...base,
      wiring: {
        kind: 'matrix',
        topology: 'split',
        diodeDirection: 'col2row',
        terminals: [{ id: 't1', kind: 'row', half: 'left', boardPin: 20 }],
      },
      encoders: [encoder, { ...encoder, id: 'e2', half: 'right' }],
    };
    expect(
      validateEncoders(split, input)
        .filter((issue) => issue.code === 'encoder-pin-conflict')
        .map((issue) => issue.path),
    ).toEqual([['encoders', 0, 'aPin']]);
  });
  it('keeps compatible controller pins and clears assignments when the connector family changes', () => {
    const before = project();
    const retained = changeController(before, {
      boardId: 'sparkfun_pro_micro_rp2040',
      boards: CONTROLLER_BOARDS,
    });
    expect(retained.encoders).toEqual(before.encoders);
    const changed = changeController(before, {
      boardId: 'seeeduino_xiao_ble',
      boards: CONTROLLER_BOARDS,
    });
    expect(changed.encoders[0]).toEqual({
      id: 'e1',
      xU: 6,
      yU: 0,
      half: 'left',
      steps: 80,
      triggersPerRotation: 20,
    });
    expect(
      validateEncoders(changed, {
        ...input,
        board: getControllerBoard('seeeduino_xiao_ble'),
      }).filter((issue) => issue.code === 'encoder-pin-missing'),
    ).toHaveLength(2);
  });
  it('validates deleted action references and unknown keycodes at the owning direction', () => {
    const before = setEncoderBinding(project(), {
      layerId: 'l0',
      encoderId: 'e1',
      direction: 'clockwise',
      binding: { kind: 'macro', macroId: 'm99' },
    });
    const next = setEncoderBinding(before, {
      layerId: 'l1',
      encoderId: 'e1',
      direction: 'counterclockwise',
      binding: { kind: 'custom', behaviorId: 'b99', parameters: [] },
    });
    const paths = validateEncoders(next, input).map((issue) => issue.path.join('.'));
    expect(paths).toEqual([
      'layers.0.encoderBindings.e1.clockwise',
      'layers.1.encoderBindings.e1.counterclockwise',
    ]);
    const unknown = setEncoderBinding(project(), {
      layerId: 'l0',
      encoderId: 'e1',
      direction: 'clockwise',
      binding: { kind: 'kp', key: { keycode: 'NO_SUCH_KEY', modifiers: [] } },
    });
    expect(validateEncoders(unknown, input)[0]?.code).toBe('binding-keycode-unknown');
  });
});

it('does not reuse a deleted layer identity still referenced by encoder rotation', () => {
  const before = setEncoderBinding(
    {
      ...UNIBODY_PRESET,
      encoders: [encoder],
      layers: [
        { id: 'l0', name: 'Base', bindings: {} },
        { id: 'l1', name: 'Fn', bindings: {} },
      ],
    },
    {
      layerId: 'l0',
      encoderId: 'e1',
      direction: 'clockwise',
      binding: { kind: 'mo', layerId: 'l1' },
    },
  );
  const removed = removeLayer(before, { layerIndex: 1 });
  const added = addLayer(removed);
  expect(added.layers[1]?.id).toBe('l2');
  expect(validateEncoders(added, input)).toContainEqual(
    expect.objectContaining({
      code: 'binding-layer-missing',
      path: ['layers', 0, 'encoderBindings', 'e1', 'clockwise'],
    }),
  );
});

it('refuses encoder resource overflow without treating ordinary missing pins as resource failures', () => {
  expect(
    getProjectResourceError({
      ...UNIBODY_PRESET,
      encoders: Array.from({ length: 16 }, (_, index) => ({ ...encoder, id: `e${index}` })),
    }),
  ).toBeUndefined();
  expect(
    getProjectResourceError({
      ...UNIBODY_PRESET,
      encoders: Array.from({ length: 17 }, (_, index) => ({ ...encoder, id: `e${index}` })),
    }),
  ).toContain('16 encoders');
});

it('rejects runtime-unsafe v0.3 counts and rounded trigger rates, including exact boundaries', () => {
  const base = { ...UNIBODY_PRESET, encoders: [encoder] };
  expect(
    validateEncoders({ ...base, encoders: [{ ...encoder, steps: 361 }] }, input),
  ).toContainEqual(
    expect.objectContaining({ code: 'encoder-invalid', path: ['encoders', 0, 'steps'] }),
  );
  for (const triggersPerRotation of [0, 7, 361, 65_535]) {
    expect(
      validateEncoders({ ...base, encoders: [{ ...encoder, triggersPerRotation }] }, input),
    ).toContainEqual(
      expect.objectContaining({
        code: 'encoder-invalid',
        path: ['encoders', 0, 'triggersPerRotation'],
      }),
    );
  }
  expect(
    validateEncoders(
      { ...base, encoders: [{ ...encoder, steps: 360, triggersPerRotation: 360 }] },
      input,
    ),
  ).toEqual([]);
  expect(
    validateEncoders(
      { ...base, encoders: [{ ...encoder, steps: 1, triggersPerRotation: 1 }] },
      input,
    ),
  ).toEqual([]);
});
