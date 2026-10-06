import { describe, expect, it } from 'vitest';
import fixtureV1 from '../../tests/fixtures/project/v1.json?raw';
import fixtureV2 from '../../tests/fixtures/project/v2.json?raw';
import fixtureSmall from '../../tests/fixtures/schematic/small.json?raw';
import { createProject } from '../domain/create-project';
import type { Binding, Project } from '../domain/types';
import { parseProjectFile } from './parse-project-file';
import { serializeProject } from './serialize-project';

function serializedText(project: Project): string {
  const serialized = serializeProject(project);
  if (!serialized.ok) {
    throw new Error(`serialize failed: ${serialized.error}`);
  }
  return serialized.value;
}

function issuePathsOf(raw: string): readonly string[] {
  const result = parseProjectFile(raw);
  if (result.ok || result.error.kind !== 'not-project') {
    return [];
  }
  return result.error.issues.map((issue) => issue.path);
}

function projectJson(binding: unknown) {
  return JSON.stringify({
    schemaVersion: 3,
    name: 'x',
    keys: [{ id: 'k1', xU: 0, yU: 0 }],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: { k1: binding } }],
  });
}

describe('parseProjectFile', () => {
  it('rejects text that is not JSON', () => {
    expect(parseProjectFile('hello')).toEqual({ ok: false, error: { kind: 'not-json' } });
  });

  it.each(['[]', '{"foo":1}', '{"schemaVersion":1.5}', '{"schemaVersion":0}'])(
    'reports a missing or invalid schemaVersion for %s',
    (raw) => {
      expect(issuePathsOf(raw)).toEqual(['schemaVersion']);
    },
  );

  it('refuses a newer schemaVersion', () => {
    expect(parseProjectFile('{"schemaVersion":99,"name":"x"}')).toEqual({
      ok: false,
      error: { kind: 'newer-version' },
    });
  });

  it('reports wrong field types with their paths', () => {
    expect(issuePathsOf('{"schemaVersion":1,"name":5}')).toEqual(['name']);
    expect(issuePathsOf('{"schemaVersion":1,"name":"x","shieldName":7}')).toEqual(['shieldName']);
  });

  it('drops unknown keys', () => {
    expect(parseProjectFile('{"schemaVersion":1,"name":"x","extra":true}')).toEqual({
      ok: true,
      value: {
        schemaVersion: 3,
        name: 'x',
        keys: [],
        wires: [],
        insulatedCrossings: [],
        layers: [{ id: 'l0', name: 'Base', bindings: {} }],
      },
    });
  });

  it('loads the v1 fixture as v3 with an empty schematic', () => {
    expect(parseProjectFile(fixtureV1)).toEqual({
      ok: true,
      value: {
        schemaVersion: 3,
        name: 'My Corne v2!',
        shieldName: 'corne',
        keys: [],
        wires: [],
        insulatedCrossings: [],
        layers: [{ id: 'l0', name: 'Base', bindings: {} }],
      },
    });
  });

  it('round-trips the v3 schematic fixture', () => {
    const expected: unknown = JSON.parse(fixtureSmall);
    expect(parseProjectFile(fixtureSmall)).toEqual({ ok: true, value: expected });
  });

  it('accepts a name that breaks project rules but is valid in shape', () => {
    expect(parseProjectFile(JSON.stringify({ schemaVersion: 1, name: 'x'.repeat(500) })).ok).toBe(
      true,
    );
  });
});

describe('bindings round trip (spec 004 FR-023, FR-024, SC-003)', () => {
  const STROKE = { keycode: 'A', modifiers: ['LC', 'RS'] } as const;
  const BINDINGS: readonly Binding[] = [
    { kind: 'kp', key: STROKE },
    { kind: 'mt', hold: { keycode: 'LSHIFT', modifiers: [] }, tap: STROKE },
    { kind: 'sk', key: STROKE },
    { kind: 'kt', key: STROKE },
    { kind: 'trans' },
    { kind: 'none' },
    { kind: 'caps_word' },
    { kind: 'key_repeat' },
    { kind: 'gresc' },
    { kind: 'bt', command: 'BT_CLR_ALL' },
    { kind: 'bt', command: 'BT_SEL', profile: 4 },
    { kind: 'out', command: 'OUT_TOG' },
    { kind: 'sys_reset' },
    { kind: 'bootloader' },
  ];

  it('keeps every binding kind through save and open', () => {
    const keys = BINDINGS.map((_, index) => ({ id: `k${index + 1}`, xU: index, yU: 0 }));
    const bindings = Object.fromEntries(
      BINDINGS.map((binding, index) => [`k${index + 1}`, binding]),
    );
    const project: Project = {
      ...createProject(),
      keys,
      layers: [{ id: 'l0', name: 'Base', bindings }],
    };
    expect(parseProjectFile(serializedText(project))).toEqual({ ok: true, value: project });
  });

  it('opens a v2 file with every key unassigned', () => {
    expect(parseProjectFile(fixtureV2)).toMatchObject({
      ok: true,
      value: { layers: [{ id: 'l0', name: 'Base', bindings: {} }] },
    });
  });
});

describe('tap-dance and mod-morph round trip (spec 005 contracts/binding-json.md)', () => {
  const TAP_DANCE = {
    kind: 'tap_dance',
    taps: [
      { keycode: 'A', modifiers: [] },
      { keycode: 'B', modifiers: ['LS'] },
    ],
    tappingTermMs: 250,
  } as const;
  const MOD_MORPH = {
    kind: 'mod_morph',
    normal: { keycode: 'ESCAPE', modifiers: [] },
    morphed: { keycode: 'GRAVE', modifiers: [] },
    mods: ['LS', 'RS'],
  } as const;

  it('keeps tap-dance and mod-morph through save and open', () => {
    const project: Project = {
      ...createProject(),
      keys: [
        { id: 'k1', xU: 0, yU: 0 },
        { id: 'k2', xU: 1, yU: 0 },
      ],
      layers: [{ id: 'l0', name: 'Base', bindings: { k1: TAP_DANCE, k2: MOD_MORPH } }],
    };
    expect(parseProjectFile(serializedText(project))).toEqual({ ok: true, value: project });
  });

  it.each([
    [{ kind: 'tap_dance', taps: [], tappingTermMs: 200 }],
    [{ kind: 'tap_dance', taps: [{ keycode: 'A', modifiers: [] }] }],
    [
      {
        kind: 'mod_morph',
        normal: { keycode: 'A', modifiers: [] },
        morphed: { keycode: 'B', modifiers: [] },
        mods: [],
      },
    ],
    [{ kind: 'mod_morph', normal: { keycode: 'A', modifiers: [] }, mods: ['LS'] }],
  ])('rejects a malformed new binding %j at its own path', (binding) => {
    // zod reports inside the union option that matched the kind (contracts/project-schema.md).
    expect(
      issuePathsOf(projectJson(binding)).some((path) => path.startsWith('layers.0.bindings.k1')),
    ).toBe(true);
  });

  it.each(['mo', 'lt', 'tog', 'to', 'sl'])(
    'rejects the layer behavior %s until layers exist (spec 005 story 4)',
    (kind) => {
      const result = parseProjectFile(projectJson({ kind, layer: 0 }));
      expect(result.ok).toBe(false);
      expect(JSON.stringify(result)).toContain('layers.0.bindings.k1');
    },
  );
});
