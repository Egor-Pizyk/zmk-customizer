import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Project } from '@domain';
import { getControllerBoard } from '@catalog/controllers';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { validateEncoders } from '@domain/encoders';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import { generateOverlay } from '@generators/shield';
import { generateKeymap } from '@generators/keymap';
import { UNIBODY_PRESET } from '../../helpers/unibody-preset';

// Hand-authored from pinned docs/zmk/encoders.md / Sofle v0.3.0 syntax; never generator output.
const hardware = readFileSync(
  new URL('../../fixtures/expected/encoders/schematic-hardware.dtsi', import.meta.url),
  'utf8',
);
const baseOverlay = readFileSync(
  new URL('../../fixtures/generated/unibody/unibody_six.overlay', import.meta.url),
  'utf8',
);
const board = getControllerBoard('nice_nano_v2');
const matrix = getMatrix(UNIBODY_PRESET);
function getMatrix(project: Project) {
  const result = deriveShieldMatrix(project, { ...board, boardId: board.id });
  if (!result.ok) {
    throw new Error('Expected complete switch matrix');
  }
  return result.value;
}
function schematicProject(): Project {
  return {
    ...UNIBODY_PRESET,
    encoders: [
      {
        id: 'e1',
        xU: 20,
        yU: 20,
        half: 'left',
        steps: 80,
        triggersPerRotation: 20,
        wiringMode: 'schematic',
        aPin: 2,
        bPin: 3,
      },
    ],
    wires: [
      ...UNIBODY_PRESET.wires,
      {
        id: 'w100',
        start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'A' },
        end: { kind: 'free', at: { xU: 19, yU: 19 }, boardPin: 20 },
        bends: [],
      },
      {
        id: 'w101',
        start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'B' },
        end: { kind: 'free', at: { xU: 22, yU: 19 }, boardPin: 21 },
        bends: [],
      },
      {
        id: 'w102',
        start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'COM' },
        end: { kind: 'free', at: { xU: 20.5, yU: 18 }, ground: true },
        bends: [],
      },
    ],
  };
}
it('uses actual A/B wires instead of misleading legacy pin fields in the independent hardware golden', () => {
  const project = schematicProject();
  expect(validateEncoders(project, { board, catalog: BINDINGS_CATALOG })).toEqual([]);
  expect(getMatrix(project)).toEqual(matrix);
  expect(generateOverlay(project, matrix, board).content).toBe(
    baseOverlay.replace(/\};\n$/u, `${hardware}};\n`),
  );
});
it('produces the same hardware and keymap bytes as the equivalent legacy GPIO assignments', () => {
  const schematic = schematicProject();
  const legacy: Project = {
    ...UNIBODY_PRESET,
    encoders: [
      {
        id: 'e1',
        xU: 20,
        yU: 20,
        half: 'left',
        aPin: 20,
        bPin: 21,
        steps: 80,
        triggersPerRotation: 20,
      },
    ],
  };
  expect(generateOverlay(schematic, matrix, board)).toEqual(generateOverlay(legacy, matrix, board));
  expect(generateKeymap(schematic)).toEqual(generateKeymap(legacy));
});
it('retains an owned ordinary push key in physical layout, matrix order and every layer binding', () => {
  const withPush: Project = {
    ...UNIBODY_PRESET,
    encoders: [
      {
        id: 'e1',
        xU: 4,
        yU: 2,
        half: 'left',
        aPin: 20,
        bPin: 21,
        pushKeyId: 'k5',
        steps: 80,
        triggersPerRotation: 20,
      },
    ],
  };
  expect(validateEncoders(withPush, { board, catalog: BINDINGS_CATALOG })).toEqual([]);
  // The association cannot add a duplicate physical key or replace its ordinary layer actions.
  const overlay = generateOverlay(withPush, matrix, board).content;
  expect(overlay.match(/<&key_physical_attrs /gu)).toHaveLength(6);
  expect(overlay).toContain('<&key_physical_attrs 100 100 400 200 0 0 0>');
  expect(overlay).toContain('RC(1,2)');
  const keymap = generateKeymap(withPush).content;
  expect(keymap).toContain('&lt 1 SPACE');
  expect(keymap).toContain('&to 0');
  expect(keymap.match(/sensor-bindings = </gu)).toHaveLength(2);
});
