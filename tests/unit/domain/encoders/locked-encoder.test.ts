import { getWireProtection, validateWireProtection } from '@domain/wires/protection';
import { expect, it } from 'vitest';
import { replaceEncoder, removeEncoder, setEncoderPushSwitch } from '@domain/encoders';
import type { Encoder, Project } from '@domain';
import { buildLockedWiringProject } from '../../../helpers/symmetric-wiring-fixtures';
import { buildProject } from '../../../helpers/build-project';

it('protects an encoder endpoint against movement, removal and pin reassignment', () => {
  const encoder: Encoder = {
    id: 'e0',
    xU: 0,
    yU: 0,
    half: 'left',
    steps: 20,
    triggersPerRotation: 20,
    wiringMode: 'schematic',
    aPin: 4,
  };
  const base: Project = {
    ...buildProject({}),
    encoders: [encoder],
    wires: [
      {
        id: 'w0',
        locked: true,
        start: { kind: 'encoder-pin', encoderId: 'e0', pin: 'A' },
        end: { kind: 'free', at: { xU: 3, yU: 0 } },
        bends: [],
      },
    ],
  };
  expect(getWireProtection(base, { encoderIds: ['e0'] }).map((wire) => wire.wireId)).toEqual([
    'w0',
  ]);
  expect(getWireProtection(base, { encoderIds: ['other'] })).toEqual([]);
  expect(replaceEncoder(base, { ...encoder, xU: 1 })).toBe(base);
  expect(replaceEncoder(base, { ...encoder, aPin: 5 })).toBe(base);
  expect(removeEncoder(base, 'e0')).toBe(base);
  expect(validateWireProtection(base, { ...base, controllerId: 'adafruit_kb2040' })).toHaveLength(
    1,
  );
});

it('refuses the entire encoder/push removal when its push key is protected', () => {
  const base: Project = {
    ...buildLockedWiringProject(),
    encoders: [
      {
        id: 'e0',
        xU: 0,
        yU: 0,
        half: 'left',
        steps: 20,
        triggersPerRotation: 20,
        wiringMode: 'schematic',
        pushKeyId: 'k0',
      },
    ],
  };
  expect(removeEncoder(base, 'e0')).toBe(base);
  expect(setEncoderPushSwitch(base, { encoderId: 'e0', enabled: false })).toBe(base);
});
