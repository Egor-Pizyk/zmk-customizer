import { describe, expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../tests/helpers/build-project';
import type { Key, Project, Wire } from './types';
import { validateSchematic } from './validate-schematic';

const KEYS: readonly Key[] = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 2, yU: 0 },
];

function wireAll(): readonly Wire[] {
  return [
    { id: 'w1', start: keyPin('k1', 1), end: freeEnd(0.3, 3, 0), bends: [] },
    { id: 'w2', start: keyPin('k1', 2), end: freeEnd(0.6333, -3, 1), bends: [] },
    { id: 'w3', start: keyPin('k2', 1), end: freeEnd(2.3, 3, 2), bends: [] },
    { id: 'w4', start: keyPin('k2', 2), end: freeEnd(2.6333, -3, 3), bends: [] },
  ];
}

function issuesOf(project: Project) {
  return validateSchematic(project).map((issue) => [issue.code, issue.path.join('.')]);
}

describe('validateSchematic', () => {
  it('reports nothing for fully wired keys on distinct board pins', () => {
    expect(issuesOf(buildProject({ keys: KEYS, wires: wireAll() }))).toEqual([]);
  });

  it('reports each key of an overlapping pair once', () => {
    const keys = [...KEYS, { id: 'k3', xU: 0.5, yU: 0.5 }];
    const codes = issuesOf(buildProject({ keys })).filter(([code]) => code === 'key-overlap');
    expect(codes).toEqual([
      ['key-overlap', 'keys.0'],
      ['key-overlap', 'keys.2'],
    ]);
  });

  it('reports every key pin without a wire', () => {
    const project = buildProject({ keys: KEYS, wires: wireAll().slice(1) });
    expect(issuesOf(project)).toEqual([['key-pin-unconnected', 'keys.0.pins.1']]);
  });

  it('reports a free end without a board pin', () => {
    const wires = wireAll().with(1, {
      id: 'w2',
      start: keyPin('k1', 2),
      end: freeEnd(0.6333, -3),
      bends: [],
    });
    expect(issuesOf(buildProject({ keys: KEYS, wires }))).toEqual([
      ['wire-end-unconnected', 'wires.1.end'],
      ['net-without-board-pin', 'keys.0.pins.2'],
    ]);
  });

  it('reports a board pin shared by ends that are not connected, once per end', () => {
    const wires = wireAll().with(2, {
      id: 'w3',
      start: keyPin('k2', 1),
      end: freeEnd(2.3, 3, 0),
      bends: [],
    });
    expect(issuesOf(buildProject({ keys: KEYS, wires }))).toEqual([
      ['board-pin-conflict', 'wires.0.end.boardPin'],
      ['board-pin-conflict', 'wires.2.end.boardPin'],
    ]);
  });

  it('allows the same board pin twice on one connection', () => {
    const join = { id: 'w5', start: keyPin('k1', 1), end: freeEnd(1, 1, 0), bends: [] };
    expect(issuesOf(buildProject({ keys: KEYS, wires: [...wireAll(), join] }))).toEqual([]);
  });

  it('reports a connection that reaches two board pins, and a shorted key', () => {
    const bridge = { id: 'w5', start: keyPin('k1', 1), end: keyPin('k1', 2), bends: [] };
    expect(issuesOf(buildProject({ keys: KEYS, wires: [...wireAll(), bridge] }))).toEqual([
      ['board-pins-shorted', 'wires.0.end.boardPin'],
      ['board-pins-shorted', 'wires.1.end.boardPin'],
      ['key-shorted', 'keys.0'],
    ]);
  });

  it('reports two keys on the same pair of nets', () => {
    const project = buildProject({
      keys: KEYS,
      wires: [
        { id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [] },
        { id: 'w2', start: keyPin('k1', 2), end: keyPin('k2', 2), bends: [] },
        { id: 'w3', start: keyPin('k1', 1), end: freeEnd(0, 3, 0), bends: [] },
        { id: 'w4', start: keyPin('k1', 2), end: freeEnd(0, -3, 1), bends: [] },
      ],
    });
    expect(issuesOf(project).filter(([code]) => code === 'keys-in-parallel')).toEqual([
      ['keys-in-parallel', 'keys.0'],
      ['keys-in-parallel', 'keys.1'],
    ]);
  });

  it('reports a connection with key pins but no board pin', () => {
    const project = buildProject({
      keys: KEYS,
      wires: [
        { id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [] },
        { id: 'w2', start: keyPin('k1', 2), end: freeEnd(0.6, -3, 1), bends: [] },
        { id: 'w3', start: keyPin('k2', 2), end: freeEnd(2.6, -3, 2), bends: [] },
      ],
    });
    const codes = issuesOf(project).filter(([code]) => code === 'net-without-board-pin');
    expect(codes).toEqual([['net-without-board-pin', 'keys.0.pins.1']]);
  });

  it('says what to do, naming the entity by its number', () => {
    const [issue] = validateSchematic(buildProject({ keys: KEYS, wires: wireAll().slice(1) }));
    expect(issue?.message).toBe('Key 0, pin 1 is not connected. Draw a wire from it.');
  });
});

it('does not report a free end at a key pin as dangling', () => {
  const project = buildProject({
    keys: KEYS,
    wires: [{ id: 'w0', start: freeEnd(0.3, 0.3667), end: freeEnd(-1, 0.3667, 2), bends: [] }],
  });
  expect(issuesOf(project)).not.toContainEqual(['wire-end-unconnected', 'wires.0.start']);
});

it('keeps a free end touching another wire dangling until it is an explicit junction', () => {
  const project = buildProject({
    wires: [
      { id: 'w0', start: freeEnd(0, 0, 2), end: freeEnd(2, 0, 2), bends: [] },
      { id: 'w1', start: freeEnd(1, 0), end: freeEnd(1, 1, 2), bends: [] },
    ],
  });
  expect(issuesOf(project)).toContainEqual(['wire-end-unconnected', 'wires.1.start']);
  expect(
    issuesOf({ ...project, insulatedCrossings: [{ wireIds: ['w0', 'w1'], ordinal: 0 }] }),
  ).toContainEqual(['wire-end-unconnected', 'wires.1.start']);
});
