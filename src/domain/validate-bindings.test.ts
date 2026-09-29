import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { validateBindings } from './validate-bindings';

const CATALOG = { keycodeNames: new Set(['A', 'SPACE', 'LSHIFT']), bluetoothProfileCount: 5 };
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
