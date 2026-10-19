import { validateBindings } from '@domain/validation';
import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';

const CATALOG = {
  keycodeNames: new Set(['A', 'SPACE', 'LSHIFT']),
  bluetoothProfileCount: 5,
  maxLayerCount: 32,
  advancedLimits: { comboKeys: 20, macroBindings: 256, macroQueue: 64 },
  encoderLimits: { maxSteps: 360, maxTriggers: 360, rotationDegrees: 360 },
  shieldLimits: {
    keyboardNameBytes: 16,
    layerNodeNameLength: 31,
    layerDisplayNameBytes: 19,
    minLayoutCell: -32_768,
    maxLayoutCell: 32_767,
  },
};
const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 1, yU: 0 },
  { id: 'k3', xU: 2, yU: 0 },
  { id: 'k4', xU: 3, yU: 0 },
];

function stroke(keycode: string) {
  return { keycode, modifiers: [] };
}

it('accepts known keycodes and profiles', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k1: { kind: 'kp', key: stroke('A') },
      k2: { kind: 'mt', hold: stroke('LSHIFT'), tap: stroke('SPACE') },
      k3: { kind: 'bt', command: 'BT_SEL', profile: 4 },
      k4: { kind: 'bt', command: 'BT_CLR' },
    },
  });
  expect(validateBindings(project, CATALOG)).toEqual([]);
});

it('reports unknown keycodes and out-of-range profiles per key, in key order', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k4: { kind: 'sk', key: stroke('BANG') },
      k3: { kind: 'bt', command: 'BT_DISC', profile: 7 },
      k2: { kind: 'mt', hold: stroke('LSHIFT'), tap: stroke('NOPE') },
      k1: { kind: 'kt', key: stroke('A') },
    },
  });
  const issues = validateBindings(project, CATALOG);
  expect(issues.map(({ code, path }) => ({ code, path }))).toEqual([
    { code: 'binding-keycode-unknown', path: ['layers', 0, 'bindings', 'k2'] },
    { code: 'binding-profile-out-of-range', path: ['layers', 0, 'bindings', 'k3'] },
    { code: 'binding-keycode-unknown', path: ['layers', 0, 'bindings', 'k4'] },
  ]);
  expect(issues[0]?.message).toContain('Key 1');
  expect(issues[0]?.message).toContain('NOPE');
});

it('names the hold keycode when both mod-tap parts are unknown', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: { k1: { kind: 'mt', hold: stroke('NOPE1'), tap: stroke('NOPE2') } },
  });
  const issues = validateBindings(project, CATALOG);
  expect(issues.map(({ code, path }) => ({ code, path }))).toEqual([
    { code: 'binding-keycode-unknown', path: ['layers', 0, 'bindings', 'k1'] },
  ]);
  expect(issues[0]?.message).toContain('NOPE1');
});

it('orders issues by layer, then key', () => {
  const first = buildProject({ keys: KEYS, bindings: { k2: { kind: 'sk', key: stroke('BANG') } } });
  const secondLayer = {
    id: 'l1',
    name: 'Second',
    bindings: { k1: { kind: 'sk', key: stroke('BANG') } },
  } as const;
  const project = { ...first, layers: [...first.layers, secondLayer] };
  const issues = validateBindings(project, CATALOG);
  expect(issues.map(({ path }) => path)).toEqual([
    ['layers', 0, 'bindings', 'k2'],
    ['layers', 1, 'bindings', 'k1'],
  ]);
});

it('accepts tap-dance with known taps and a pause in range', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k1: { kind: 'tap_dance', taps: [stroke('A'), stroke('SPACE')], tappingTermMs: 250 },
    },
  });
  expect(validateBindings(project, CATALOG)).toEqual([]);
});

it('reports unknown tap keycodes and out-of-range tapping terms per key, in key order', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k3: { kind: 'tap_dance', taps: [stroke('A')], tappingTermMs: 6000 },
      k2: { kind: 'tap_dance', taps: [stroke('A'), stroke('NOPE')], tappingTermMs: 200 },
      k4: { kind: 'tap_dance', taps: [stroke('SPACE')], tappingTermMs: -5 },
      k1: { kind: 'kp', key: stroke('A') },
    },
  });
  const issues = validateBindings(project, CATALOG);
  expect(issues.map(({ code, path }) => ({ code, path }))).toEqual([
    { code: 'binding-keycode-unknown', path: ['layers', 0, 'bindings', 'k2'] },
    { code: 'binding-tapping-term-out-of-range', path: ['layers', 0, 'bindings', 'k3'] },
    { code: 'binding-tapping-term-out-of-range', path: ['layers', 0, 'bindings', 'k4'] },
  ]);
  expect(issues[0]?.message).toContain('NOPE');
  expect(issues[1]?.message).toContain('6000');
});

it('accepts mod-morph with known actions and reports unknown or equal ones per key', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k1: {
        kind: 'mod_morph',
        normal: stroke('A'),
        morphed: stroke('NOPE'),
        mods: ['LS'],
      },
      k2: {
        kind: 'mod_morph',
        normal: stroke('SPACE'),
        morphed: stroke('SPACE'),
        mods: ['LS'],
      },
      k3: {
        kind: 'mod_morph',
        normal: stroke('A'),
        morphed: stroke('SPACE'),
        mods: ['LS', 'RS'],
      },
    },
  });
  const issues = validateBindings(project, CATALOG);
  expect(issues.map(({ code, path }) => ({ code, path }))).toEqual([
    { code: 'binding-keycode-unknown', path: ['layers', 0, 'bindings', 'k1'] },
    { code: 'binding-mod-morph-same-action', path: ['layers', 0, 'bindings', 'k2'] },
  ]);
  expect(issues[0]?.message).toContain('NOPE');
  expect(issues[1]?.message).toContain('SPACE');
});

it('reports layer behaviors whose layer was deleted, at the key (spec 007 FR-012)', () => {
  const project = buildProject({
    keys: [...KEYS, { id: 'k5', xU: 4, yU: 0 }],
    layers: [
      {
        id: 'l0',
        name: 'Base',
        bindings: {
          k1: { kind: 'mo', layerId: 'l7' },
          k2: { kind: 'tog', layerId: 'l7' },
          k3: { kind: 'to', layerId: 'l0' },
          k4: { kind: 'sl', layerId: 'l1' },
          k5: { kind: 'lt', layerId: 'l7', tap: stroke('SPACE') },
        },
      },
      {
        id: 'l1',
        name: 'Nav',
        bindings: {
          k1: { kind: 'sl', layerId: 'l7' },
          k2: { kind: 'to', layerId: 'l7' },
          k3: { kind: 'mo', layerId: 'l1' },
        },
      },
    ],
  });
  const issues = validateBindings(project, CATALOG);
  expect(issues.map(({ code, path }) => ({ code, path }))).toEqual([
    { code: 'binding-layer-missing', path: ['layers', 0, 'bindings', 'k1'] },
    { code: 'binding-layer-missing', path: ['layers', 0, 'bindings', 'k2'] },
    { code: 'binding-layer-missing', path: ['layers', 0, 'bindings', 'k5'] },
    { code: 'binding-layer-missing', path: ['layers', 1, 'bindings', 'k1'] },
    { code: 'binding-layer-missing', path: ['layers', 1, 'bindings', 'k2'] },
  ]);
  expect(issues[0]?.message).toBe(
    'Key 0 on layer Base uses a deleted layer. Pick another layer in Bindings.',
  );
});

it('checks the tap keycode of layer-tap', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: { k1: { kind: 'lt', layerId: 'l0', tap: stroke('NOPE') } },
  });
  expect(validateBindings(project, CATALOG).map(({ code }) => code)).toEqual([
    'binding-keycode-unknown',
  ]);
});

it.each([0.5, Number.NaN, Infinity, -Infinity])(
  'rejects a non-integer/non-finite tap pause %s',
  (tappingTermMs) => {
    const project = buildProject({
      keys: KEYS,
      bindings: { k1: { kind: 'tap_dance', taps: [stroke('A')], tappingTermMs } },
    });
    expect(validateBindings(project, CATALOG).map((issue) => issue.code)).toEqual([
      'binding-tapping-term-out-of-range',
    ]);
  },
);
