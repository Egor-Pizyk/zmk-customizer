import { getResultValue } from '../../tests/helpers/result';
import { expect, it } from 'vitest';
import { buildUnibodyProject } from '../../tests/helpers/build-unibody-project';
import { buildMatrixProject } from '../../tests/helpers/build-matrix-project';
import { deriveShieldMatrix } from '../domain/derive-shield-matrix';
import { reverseKeyDiode } from '../domain/reverse-key-diode';
import { moveLayer } from '../domain/move-layer';
import type { Binding, Project } from '../domain/types';
import { generateShieldFiles } from './generate-shield-files';

const goldens = import.meta.glob<string>('../../tests/fixtures/generated/unibody/*', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const target = {
  boardId: 'nice_nano_v2',
  connector: 'pro_micro' as const,
  gpioPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 18, 19, 20, 21],
};
function files(project: Project) {
  return generateShieldFiles(project, getResultValue(deriveShieldMatrix(project, target)), target);
}
function keymap(project: Project) {
  return files(project).find((file) => file.path.endsWith('.keymap'))?.content ?? '';
}

it('matches all five independently approved golden files byte for byte', () => {
  const generated = files(buildUnibodyProject());
  expect(generated.map((file) => file.path)).toEqual(
    [
      'Kconfig.shield',
      'Kconfig.defconfig',
      'unibody_six.overlay',
      'unibody_six.keymap',
      'unibody_six.conf',
    ].map((name) => `boards/shields/unibody_six/${name}`),
  );
  for (const file of generated) {
    expect(file.content).toBe(
      goldens[`../../tests/fixtures/generated/unibody/${file.path.split('/').at(-1)}`],
    );
  }
});
it('matches the independently authored row2col overlay golden', () => {
  const project = buildUnibodyProject();
  let reversed = project;
  for (const key of project.keys) {
    reversed = reverseKeyDiode(reversed, { keyId: key.id });
  }
  expect(fileContent(files(reversed), '.overlay')).toBe(
    goldens['../../tests/fixtures/generated/unibody/row2col.overlay'],
  );
});
it('is stable and uses LF with exactly one newline', () => {
  const project = buildUnibodyProject();
  expect(files(project)).toEqual(files(structuredClone(project)));
  for (const file of files(project)) {
    expect(file.content).not.toContain('\r');
    expect(file.content.endsWith('\n')).toBe(true);
    expect(file.content.endsWith('\n\n')).toBe(false);
  }
});
it('resolves layer ids after reordering and retains key order and missing none', () => {
  const project = buildUnibodyProject();
  const moved = moveLayer(project, { layerIndex: 1, toIndex: 0 });
  expect(keymap(moved)).toContain('&mo 0');
  expect(keymap(moved)).toContain('&lt 0 SPACE');
  expect(keymap(moved)).toContain('&to 1');
  expect(keymap(moved).indexOf('fn_layer')).toBeLessThan(keymap(moved).indexOf('base_layer'));
  const reversed = { ...project, keys: project.keys.toReversed() };
  const text = keymap(reversed);
  expect(text.indexOf('&lt 1 SPACE')).toBeLessThan(text.indexOf('&kp A'));
  const missing = { ...project, layers: [{ id: 'l0', name: 'Base', bindings: {} }] };
  expect(keymap(missing).match(/&none/gu)).toHaveLength(6);
  const overlay = fileContent(files(reversed), '.overlay');
  expect(overlay.indexOf('RC(1,2)')).toBeLessThan(overlay.indexOf('RC(0,0)'));
  expect(overlay.indexOf('100 100 400 200')).toBeLessThan(overlay.indexOf('100 100 0 0'));
});
it('deduplicates custom definitions across layers independent of object property insertion order', () => {
  const project = buildUnibodyProject();
  const first = getBaseLayer(project);
  const repeated: Binding = {
    tappingTermMs: 200,
    taps: [
      { modifiers: [], keycode: 'C' },
      { keycode: 'D', modifiers: [] },
    ],
    kind: 'tap_dance',
  };
  const text = keymap({
    ...project,
    layers: [
      ...project.layers,
      {
        id: 'l2',
        name: 'Extra',
        bindings: { k0: repeated, k1: getMorphBinding(first) },
      },
    ],
  });
  expect(text.match(/compatible = "zmk,behavior-tap-dance"/gu)).toHaveLength(1);
  expect(text.match(/compatible = "zmk,behavior-mod-morph"/gu)).toHaveLength(1);
  expect(text.match(/&custom_td_0/gu)).toHaveLength(2);
  expect(text.match(/&custom_mm_1/gu)).toHaveLength(2);
});
it('covers every supported built-in binding and BT macro/profile parameter forms', () => {
  const bindings: readonly Binding[] = [
    { kind: 'kp', key: { keycode: 'A', modifiers: ['LC', 'LS', 'RC'] } },
    {
      kind: 'mt',
      hold: { keycode: 'LEFT_SHIFT', modifiers: [] },
      tap: { keycode: 'A', modifiers: [] },
    },
    { kind: 'sk', key: { keycode: 'LEFT_CONTROL', modifiers: [] } },
    { kind: 'kt', key: { keycode: 'CAPSLOCK', modifiers: [] } },
    ...(
      ['trans', 'none', 'caps_word', 'key_repeat', 'gresc', 'sys_reset', 'bootloader'] as const
    ).map((kind) => ({ kind })),
    ...(['BT_CLR', 'BT_CLR_ALL', 'BT_NXT', 'BT_PRV'] as const).map((command) => ({
      kind: 'bt' as const,
      command,
    })),
    { kind: 'bt', command: 'BT_SEL', profile: 2 },
    { kind: 'bt', command: 'BT_DISC', profile: 3 },
    ...(['OUT_TOG', 'OUT_USB', 'OUT_BLE'] as const).map((command) => ({
      kind: 'out' as const,
      command,
    })),
    ...(['mo', 'tog', 'to', 'sl'] as const).map((kind) => ({ kind, layerId: 'l0' })),
    { kind: 'lt', layerId: 'l0', tap: { keycode: 'SPACE', modifiers: ['LS'] } },
  ];
  const expected = [
    '&kp LC(LS(RC(A)))',
    '&mt LEFT_SHIFT A',
    '&sk LEFT_CONTROL',
    '&kt CAPSLOCK',
    '&trans',
    '&none',
    '&caps_word',
    '&key_repeat',
    '&gresc',
    '&sys_reset',
    '&bootloader',
    '&bt BT_CLR',
    '&bt BT_CLR_ALL',
    '&bt BT_NXT',
    '&bt BT_PRV',
    '&bt BT_SEL 2',
    '&bt BT_DISC 3',
    '&out OUT_TOG',
    '&out OUT_USB',
    '&out OUT_BLE',
    '&mo 0',
    '&tog 0',
    '&to 0',
    '&sl 0',
    '&lt 0 LS(SPACE)',
  ];
  const project = buildMatrixProject([[2, 8]]);
  for (const [index, binding] of bindings.entries()) {
    const text = keymap({
      ...project,
      layers: [{ id: 'l0', name: 'Base', bindings: { k0: binding } }],
    });
    expect(text).toContain(`                ${expected[index]}\n`);
  }
});
it('emits row2col input pulls on columns and preserves signed rounded geometry', () => {
  const project = buildMatrixProject([[2, 8]], { pin: 1, cathode: 'toward-switch' });
  const generated = files({
    ...project,
    keys: Array.from(project.keys, (key) => ({ ...key, xU: -1.235, yU: -0.5 })),
  });
  const overlay = fileContent(generated, '.overlay');
  expect(overlay).toContain('diode-direction = "row2col"');
  expect(overlay).toContain('row-gpios = <&pro_micro 2 GPIO_ACTIVE_HIGH>');
  expect(overlay).toContain('col-gpios = <&pro_micro 8 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>');
  expect(overlay).toContain('100 100 (-124) (-50) 0 0 0');
  expect(overlay).not.toContain('zmk,matrix-transform =');
});
it('escapes display text separately for Kconfig macro expansion and Devicetree', () => {
  const generated = files({ ...buildUnibodyProject(), name: 'A"\\$(X)' });
  const defconfig = fileContent(generated, 'defconfig');
  expect(defconfig).toContain(String.raw`default "A\"\\\$(X)"`);
  const overlay = fileContent(generated, '.overlay');
  expect(overlay).toContain(String.raw`display-name = "A\"\\$(X)"`);
});

function fileContent(generated: ReturnType<typeof files>, suffix: string): string {
  const file = generated.find((candidate) => candidate.path.endsWith(suffix));
  if (file === undefined) {
    throw new Error(`Missing file ${suffix}`);
  }
  return file.content;
}
function getBaseLayer(project: Project) {
  const layer = project.layers[0];
  if (layer === undefined) {
    throw new Error('Missing base');
  }
  return layer;
}
function getMorphBinding(layer: ReturnType<typeof getBaseLayer>): Binding {
  const binding = layer.bindings['k4'];
  if (binding === undefined) {
    throw new Error('Missing morph binding');
  }
  return binding;
}
