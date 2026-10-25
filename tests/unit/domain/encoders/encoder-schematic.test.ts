import { describe, expect, it } from 'vitest';
import { createProject, PROJECT_BUDGET } from '@domain/project';
import {
  placeEncoder,
  replaceEncoder,
  removeEncoder,
  setEncoderPushSwitch,
  validateEncoders,
} from '@domain/encoders';
import { getEncoderGeometry, getEncoderPinPosition } from '@domain/geometry';
import { canAddWire } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import { getWirePath } from '@domain/wires/geometry';
import { getControllerBoard } from '@catalog/controllers';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import type { Encoder, Project, Wire, Layer } from '@domain';

const defaults = { steps: 80, triggersPerRotation: 20 };
function placed(): Project {
  return placeEncoder(createProject({ controllerId: 'nice_nano_v2' }), {
    position: { xU: 4, yU: 3 },
    defaults,
  });
}
function first(project: Project): Encoder {
  const encoder = project.encoders[0];
  if (encoder === undefined) {
    throw new Error('Missing encoder');
  }
  return encoder;
}

describe('schematic encoder body, push switch and contacts', () => {
  it('places a stable push key atomically and changes its geometry about the body center', () => {
    const project = placed();
    const encoder = first(project);
    expect(encoder.wiringMode).toBe('schematic');
    expect(project.keys).toHaveLength(1);
    expect(project.keys[0]?.id).toBe(encoder.pushKeyId);
    const moved = replaceEncoder(project, { ...encoder, xU: 8, yU: 6, rotationDeg: 90 });
    expect(getEncoderGeometry(moved, first(moved))).toEqual({ xU: 8, yU: 6, rotationDeg: 90 });
    const key = moved.keys[0];
    expect(key).toMatchObject({
      xU: 8,
      yU: 6,
      rotationDeg: 90,
      rotationOriginXU: 8.5,
      rotationOriginYU: 6.5,
    });
    expect(project.keys[0]).toMatchObject({ xU: 4, yU: 3 });
    const pin = getEncoderPinPosition(moved, first(moved), 'A');
    expect(pin.xU).toBeCloseTo(9.15);
    expect(pin.yU).toBeCloseTo(6.15);
  });
  it('keeps button identities/bindings until explicitly removed and cleans dangling rotary wires', () => {
    const project = placed();
    const encoder = first(project);
    const keyId = pushId(encoder);
    const bound = {
      ...project,
      layers: project.layers.map((layer) => withBinding(layer, keyId)),
    };
    const noButton = setEncoderPushSwitch(bound, { encoderId: encoder.id, enabled: false });
    expect(noButton.keys).toHaveLength(0);
    expect(first(noButton).pushKeyId).toBeUndefined();
    expect(noButton.layers[0]?.bindings).toEqual({});
    expect(removeEncoder(bound, encoder.id).encoders).toHaveLength(0);
    expect(removeEncoder(bound, encoder.id).keys).toHaveLength(0);
  });
  it('resolves rotary endpoints dynamically and joins wires by contact identity', () => {
    const project = placed();
    const encoder = first(project);
    const start = { kind: 'encoder-pin' as const, encoderId: encoder.id, pin: 'A' as const };
    const wired = {
      ...project,
      wires: [
        {
          id: 'w0',
          start,
          end: { kind: 'free' as const, at: { xU: 2, yU: 2 }, boardPin: 20 },
          bends: [],
        },
        {
          id: 'w1',
          start,
          end: { kind: 'free' as const, at: { xU: 1, yU: 2 }, boardPin: 21 },
          bends: [],
        },
      ],
    };
    const wire = requiredWire(wired);
    expect(canAddWire(project, wire)).toBe('ok');
    expect(getWirePath(wired, wire)[0]).toEqual(getEncoderPinPosition(wired, encoder, 'A'));
    expect(getNets(wired).find((net) => net.wireIds.includes('w0'))?.wireIds).toEqual(['w0', 'w1']);
    expect(
      validateEncoders(wired, {
        board: getControllerBoard('nice_nano_v2'),
        catalog: BINDINGS_CATALOG,
      }).some((issue) => issue.code === 'encoder-pin-conflict'),
    ).toBe(true);
    expect(removeEncoder(wired, encoder.id).wires).toHaveLength(0);
  });
  it('preserves limits, missing identities and explicit legacy wiring', () => {
    const project = placed();
    const encoder = first(project);
    expect(setEncoderPushSwitch(project, { encoderId: encoder.id, enabled: true })).toBe(project);
    expect(setEncoderPushSwitch(project, { encoderId: 'e99', enabled: true })).toBe(project);
    expect(replaceEncoder(project, { ...encoder, id: 'e99' })).toBe(project);

    const fullEncoders = {
      ...project,
      encoders: Array.from({ length: 16 }, (_, index) => ({ ...encoder, id: `e${index + 1}` })),
    };
    expect(placeEncoder(fullEncoders, { position: { xU: 0, yU: 0 }, defaults })).toBe(fullEncoders);

    const withoutButton = setEncoderPushSwitch(project, {
      encoderId: encoder.id,
      enabled: false,
    });
    const fullKeys = {
      ...withoutButton,
      keys: Array.from({ length: PROJECT_BUDGET.keys }, (_, index) => ({
        id: `k${index + 1}`,
        xU: index,
        yU: 0,
      })),
    };
    expect(setEncoderPushSwitch(fullKeys, { encoderId: encoder.id, enabled: true })).toBe(fullKeys);

    const rotaryWire: Wire = {
      id: 'w0',
      start: { kind: 'encoder-pin', encoderId: encoder.id, pin: 'A' },
      end: { kind: 'free', at: { xU: 0, yU: 0 } },
      bends: [],
    };
    const wired = {
      ...project,
      wiring: {
        kind: 'matrix' as const,
        topology: 'split' as const,
        diodeDirection: 'col2row' as const,
        terminals: [],
      },
      wires: [rotaryWire],
    };
    const { wiringMode: _schematic, ...legacy } = encoder;
    expect(replaceEncoder(wired, legacy)).toBe(wired);
  });
});

function pushId(encoder: Encoder): string {
  if (encoder.pushKeyId === undefined) {
    throw new Error('Missing push key');
  }
  return encoder.pushKeyId;
}
function requiredWire(project: Project): Wire {
  const wire = project.wires[0];
  if (wire === undefined) {
    throw new Error('Missing wire');
  }
  return wire;
}

function withBinding(layer: Layer, keyId: string): Layer {
  return { ...layer, bindings: { [keyId]: { kind: 'none' } } };
}
