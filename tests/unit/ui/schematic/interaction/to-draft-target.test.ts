import { toDraftTarget } from '@ui/schematic/interaction';
import { expect, it } from 'vitest';
import { buildProject } from '../../../../helpers/build-project';

const PROJECT = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });

// Regression: pin 2's hit circle is drawn over pin 1's, so the DOM reported pin 2 for a click
// on pin 1 and wires could not start or end on the lower pin.
it('takes the pin nearest to the click, whatever hit circle is on top', () => {
  const target = toDraftTarget(PROJECT, {
    hit: { kind: 'pin', keyId: 'k1', pin: 2 },
    world: { xU: 0.33, yU: 0.35 },
    snapped: { xU: 0.25, yU: 0.25 },
  });
  expect(target).toEqual({ kind: 'key-pin', keyId: 'k1', pin: 1, point: { xU: 0.3, yU: 0.3667 } });
});

it('snaps to the diode outer terminal rather than the nearby other pin', () => {
  const project = buildProject({
    keys: [{ id: 'k1', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } }],
    wires: [
      {
        id: 'w0',
        start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
        end: { kind: 'free', at: { xU: 2, yU: 0.3667 } },
        bends: [],
      },
    ],
  });
  expect(
    toDraftTarget(project, {
      hit: { kind: 'pin', keyId: 'k1', pin: 2 },
      world: { xU: 0.62, yU: 0.3667 },
      snapped: { xU: 0.5, yU: 0.25 },
    }),
  ).toEqual({ kind: 'key-pin', keyId: 'k1', pin: 1, point: { xU: 0.62, yU: 0.3667 } });
});
