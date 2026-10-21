import { serializeProject, parseProjectFile } from '@storage/project';
import type { ProjectFileError } from '@storage/project';
import { createProject } from '@domain/project';

import { expect, it } from 'vitest';
import { getResultError } from '../../../helpers/result';

function issuePaths(error: ProjectFileError) {
  if (error.kind !== 'not-project') {
    throw new Error('Expected resource diagnosis');
  }
  return error.issues.map((issue) => issue.path);
}

const KEY = { id: 'k1', xU: 0, yU: 0 };
const WIRE = {
  id: 'w1',
  start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
  end: { kind: 'free', at: { xU: 2, yU: 0 } },
  bends: [],
} as const;
function keys(count: number) {
  return Array.from({ length: count }, (_, index) => ({ ...KEY, id: `k${index}` }));
}
function wires(count: number, bendCount = 0) {
  return Array.from({ length: count }, (_, index) => ({
    ...WIRE,
    id: `w${index}`,
    bends: Array.from({ length: bendCount }, (_point, bend) => ({ xU: bend % 2, yU: bend })),
  }));
}

it.each([
  { path: 'keys', accepted: { keys: keys(512) }, rejected: { keys: keys(513) } },
  {
    path: 'wires',
    accepted: { keys: [KEY], wires: wires(600) },
    rejected: { keys: [KEY], wires: wires(601) },
  },
  {
    path: 'wires.0.bends',
    accepted: { keys: [KEY], wires: wires(1, 64) },
    rejected: { keys: [KEY], wires: wires(1, 65) },
  },
  {
    path: 'wires',
    accepted: { keys: [KEY], wires: wires(23, 64) },
    rejected: { keys: [KEY], wires: wires(24, 64) },
  },
  {
    path: 'layers',
    accepted: {
      layers: Array.from({ length: 64 }, (_, index) => ({
        id: `l${index}`,
        name: 'Layer',
        bindings: {},
      })),
    },
    rejected: {
      layers: Array.from({ length: 65 }, (_, index) => ({
        id: `l${index}`,
        name: 'Layer',
        bindings: {},
      })),
    },
  },
  { path: 'name', accepted: { name: 'a'.repeat(4096) }, rejected: { name: 'a'.repeat(4097) } },
  {
    path: 'keys.0.id',
    accepted: { keys: [{ ...KEY, id: `k${'9'.repeat(127)}` }] },
    rejected: { keys: [{ ...KEY, id: `k${'9'.repeat(128)}` }] },
  },
])(
  'accepts the $path resource boundary and rejects excess without truncation',
  ({ path, accepted, rejected }) => {
    expect(
      parseProjectFile(
        JSON.stringify({ ...createProject({ controllerId: 'nice_nano_v2' }), ...accepted }),
      ).ok,
    ).toBe(true);
    const result = parseProjectFile(
      JSON.stringify({ ...createProject({ controllerId: 'nice_nano_v2' }), ...rejected }),
    );
    expect(result.ok).toBe(false);
    const error = getResultError(result);
    expect(error.kind).toBe('not-project');
    expect(issuePaths(error)).toContain(path);
  },
);

function collectionText(tapCount: number, crossingCount: number) {
  return JSON.stringify({
    ...createProject({ controllerId: 'nice_nano_v2' }),
    keys: [KEY],
    wires: wires(2),
    layers: [
      {
        id: 'l0',
        name: 'Base',
        bindings: {
          k1: {
            kind: 'tap_dance',
            taps: Array.from({ length: tapCount }, () => ({ keycode: 'A', modifiers: [] })),
            tappingTermMs: 200,
          },
        },
      },
    ],
    insulatedCrossings: Array.from({ length: crossingCount }, (_, ordinal) => ({
      wireIds: ['w0', 'w1'],
      ordinal,
    })),
  });
}

it('bounds tap collections and stored crossing exceptions', () => {
  expect(parseProjectFile(collectionText(64, 8192)).ok).toBe(true);
  expect(parseProjectFile(collectionText(65, 8192)).ok).toBe(false);
  expect(parseProjectFile(collectionText(64, 8193)).ok).toBe(false);
});

it('enforces byte limits for direct parsing, including multibyte input', () => {
  expect(parseProjectFile(' '.repeat(5 * 1024 * 1024 + 1))).toEqual({
    ok: false,
    error: { kind: 'too-large' },
  });
  expect(parseProjectFile('é'.repeat(3 * 1024 * 1024))).toEqual({
    ok: false,
    error: { kind: 'too-large' },
  });
});

it('keeps compact input when indentation alone exceeds the byte budget', () => {
  const projectKeys = keys(512);
  const bindings = Object.fromEntries(
    projectKeys.map((key) => [
      key.id,
      { kind: 'kp' as const, key: { keycode: 'A'.repeat(60), modifiers: [] } },
    ]),
  );
  const project = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    keys: projectKeys,
    layers: Array.from({ length: 64 }, (_, index) => ({
      id: `l${index}`,
      name: 'Layer',
      bindings,
    })),
  };
  const raw = JSON.stringify(project);
  expect(new TextEncoder().encode(raw).length).toBeLessThan(5 * 1024 * 1024);
  expect(parseProjectFile(raw)).toEqual({ ok: true, value: project });
  expect(serializeProject(project).ok).toBe(true);
});
