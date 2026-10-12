import { expect, it } from 'vitest';
import { findKeyCurrentFlow } from './find-key-current-flow';
import { reverseKeyDiode } from './reverse-key-diode';
import { toggleKeyDiode } from './toggle-key-diode';
import { createProject } from './create-project';
import { moveKey } from './move-key';
import { removeKey } from './remove-key';

it.each([
  { pin: 1, otherPin: 2 },
  { pin: 2, otherPin: 1 },
] as const)(
  'exposes current polarity on pin %s and reverses without rewiring',
  ({ pin, otherPin }) => {
    const project = { ...createProject(), keys: [{ id: 'k1', xU: 0, yU: 0 }] };
    expect(findKeyCurrentFlow(project.keys[0])).toBeUndefined();
    const added = toggleKeyDiode(project, { keyId: 'k1', pin });
    expect(findKeyCurrentFlow(added.keys[0])).toEqual({ fromPin: otherPin, toPin: pin });
    const reversed = reverseKeyDiode(added, { keyId: 'k1' });
    expect(findKeyCurrentFlow(reversed.keys[0])).toEqual({ fromPin: pin, toPin: otherPin });
    expect(reverseKeyDiode(reversed, { keyId: 'k1' })).toEqual(added);
    expect(reverseKeyDiode(project, { keyId: 'k1' })).toBe(project);
    expect(reverseKeyDiode(project, { keyId: 'missing' })).toBe(project);
    expect(moveKey(added, { keyId: 'k1', position: { xU: 2, yU: 2 } }).keys[0]?.diode).toEqual(
      added.keys[0]?.diode,
    );
    expect(removeKey(added, { keyId: 'k1' }).keys).toEqual([]);
  },
);
