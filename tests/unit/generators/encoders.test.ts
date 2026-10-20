import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Project } from '@domain';
import { UNIBODY_PRESET } from '../../helpers/unibody-preset';
import { getControllerBoard } from '@catalog/controllers';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import {
  generateOverlay,
  generateSplitOverlays,
  generateKconfigDefconfig,
} from '@generators/shield';
import { generateKeymap, renderEncoderBehaviors } from '@generators/keymap';
import { getResultValue } from '../../helpers/result';

const hardware = readFileSync(
  new URL('../../fixtures/expected/encoders/hardware.dtsi', import.meta.url),
  'utf8',
);
const rotations = readFileSync(
  new URL('../../fixtures/expected/encoders/rotations.dtsi', import.meta.url),
  'utf8',
);
const driver = readFileSync(
  new URL('../../fixtures/expected/encoders/driver.kconfig', import.meta.url),
  'utf8',
);
const baseOverlay = readFileSync(
  new URL('../../fixtures/generated/unibody/unibody_six.overlay', import.meta.url),
  'utf8',
);
const baseKeymap = readFileSync(
  new URL('../../fixtures/generated/unibody/unibody_six.keymap', import.meta.url),
  'utf8',
);
const baseDefaults = readFileSync(
  new URL('../../fixtures/generated/unibody/Kconfig.defconfig', import.meta.url),
  'utf8',
);
const upstream = readFileSync(
  new URL('../../fixtures/upstream/sofle/sofle.dtsi', import.meta.url),
  'utf8',
);
const board = getControllerBoard('nice_nano_v2');
const matrix = getResultValue(deriveShieldMatrix(UNIBODY_PRESET, { ...board, boardId: board.id }));
function encoderProject(): Project {
  return {
    ...UNIBODY_PRESET,
    encoders: [
      {
        id: 'e99',
        xU: 6,
        yU: 0,
        half: 'left',
        aPin: 21,
        bPin: 20,
        steps: 80,
        triggersPerRotation: 20,
      },
      {
        id: 'e2',
        xU: 8,
        yU: 0,
        half: 'right',
        aPin: 20,
        bPin: 21,
        steps: 40,
        triggersPerRotation: 10,
      },
    ],
    wiring: { kind: 'matrix', topology: 'split', diodeDirection: 'col2row', terminals: [] },
    layers: UNIBODY_PRESET.layers.map((layer, index) => ({
      ...layer,
      encoderBindings:
        index === 0
          ? {
              e99: {
                clockwise: { kind: 'kp', key: { keycode: 'C_VOL_UP', modifiers: [] } },
                counterclockwise: { kind: 'kp', key: { keycode: 'C_VOL_DN', modifiers: [] } },
              },
            }
          : {
              e2: {
                clockwise: { kind: 'kp', key: { keycode: 'PG_UP', modifiers: [] } },
                counterclockwise: { kind: 'kp', key: { keycode: 'PG_DN', modifiers: [] } },
              },
            },
    })),
  };
}
it('matches independent Sofle-based hardware golden with ordered per-sensor counts', () => {
  expect(upstream).toContain('a-gpios = <&pro_micro 21 (GPIO_ACTIVE_HIGH | GPIO_PULL_UP)>;');
  expect(generateOverlay(encoderProject(), matrix, board).content).toBe(
    baseOverlay.replace(/\};\n$/u, `${hardware}};\n`),
  );
  const xiao = generateOverlay(encoderProject(), matrix, { connector: 'xiao_d' }).content;
  expect(xiao).toContain('a-gpios = <&xiao_d 21 (GPIO_ACTIVE_HIGH | GPIO_PULL_UP)>;');
});
it('matches independent sensor-rotation golden and inserts one binding per sensor on every layer', () => {
  const project = encoderProject();
  expect(renderEncoderBehaviors(project, () => 'unused').text).toBe(rotations);
  const output = generateKeymap(project).content;
  expect(output).toContain('sensor-bindings = <&encoder_rotation_0_0 &encoder_rotation_0_1>;');
  expect(output).toContain('sensor-bindings = <&encoder_rotation_0_1 &encoder_rotation_1_1>;');
  expect(generateKeymap({ ...project, encoders: [...project.encoders] }).content).toBe(output);
});
it('enables only local split nodes and applies guarded driver defaults', () => {
  const project = encoderProject();
  const splitMatrix = {
    ...matrix,
    halves: {
      left: { rowPins: [2, 3], colPins: [4, 5, 6] },
      right: { rowPins: [2, 3], colPins: [4, 5, 6] },
    },
  };
  const files = generateSplitOverlays(project, splitMatrix, board);
  expect(files[1]?.content).toContain('&encoder_0 { status = "okay"; };');
  expect(files[1]?.content).not.toContain('&encoder_1');
  expect(files[2]?.content).toContain('&encoder_1 { status = "okay"; };');
  expect(files[2]?.content).not.toContain('&encoder_0');
  expect(generateKconfigDefconfig(project).content).toContain(driver);
  const unibody = {
    ...project,
    wiring: {
      ...project.wiring,
      kind: 'matrix',
      topology: 'unibody',
      diodeDirection: 'col2row',
      terminals: [],
    } as const,
  };
  expect(generateOverlay(unibody, matrix, board).content.match(/status = "okay"/gu)).toHaveLength(
    2,
  );
  expect(generateKconfigDefconfig(unibody).content).toBe(
    baseDefaults.replace('endif\n', `${driver}endif\n`),
  );
});
it('preserves complete no-encoder output bytes', () => {
  expect(generateOverlay(UNIBODY_PRESET, matrix, board).content).toBe(baseOverlay);
  expect(generateKeymap(UNIBODY_PRESET).content).toBe(baseKeymap);
  expect(generateKconfigDefconfig(UNIBODY_PRESET).content).toBe(baseDefaults);
});

it('shares one empty rotation behavior across the maximum sensor/layer grid', () => {
  const project = encoderProject();
  const many: Project = {
    ...project,
    encoders: Array.from({ length: 16 }, (_, index) => ({
      ...project.encoders[0],
      id: `e${index}`,
      xU: index,
      yU: 0,
      half: 'left',
      steps: 80,
      triggersPerRotation: 20,
    })),
    layers: Array.from({ length: 32 }, (_, index) => ({
      id: `l${index}`,
      name: `Layer ${index}`,
      bindings: {},
    })),
  };
  const keymap = generateKeymap(many).content;
  expect(keymap.match(/compatible = "zmk,behavior-sensor-rotate";/gu)).toHaveLength(1);
  expect(keymap.match(/sensor-bindings = </gu)).toHaveLength(32);
  expect(keymap.match(/&encoder_rotation_0_0/gu)).toHaveLength(512);
});
