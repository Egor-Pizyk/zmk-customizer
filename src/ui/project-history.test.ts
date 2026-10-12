import { describe, expect, it } from 'vitest';
import type { Project } from '../domain/types';
import { UNDO_LIMIT, reduceProjectHistory } from './project-history';
import type { ProjectHistory } from './project-history';

function named(name: string): Project {
  return {
    schemaVersion: 5,
    controllerId: 'nice_nano_v2',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
    name,
  };
}

function rename(name: string) {
  return { kind: 'commit', update: (project: Project) => ({ ...project, name }) } as const;
}

const START: ProjectHistory = { past: [], present: named('A'), future: [] };

describe('reduceProjectHistory', () => {
  it('ignores a commit that returns the same project', () => {
    expect(reduceProjectHistory(START, { kind: 'commit', update: (project) => project })).toBe(
      START,
    );
  });

  it('pushes the present to past and clears future on commit', () => {
    const withFuture: ProjectHistory = { ...START, future: [named('Z')] };
    expect(reduceProjectHistory(withFuture, rename('B'))).toEqual({
      past: [named('A')],
      present: named('B'),
      future: [],
    });
  });

  it(`keeps at most ${UNDO_LIMIT} undo steps`, () => {
    let history = START;
    for (let i = 0; i < 101; i += 1) {
      history = reduceProjectHistory(history, rename(`N${i}`));
    }
    expect(history.past).toHaveLength(100);
    expect(history.past[0]).toEqual(named('N0'));
  });

  it('moves present between the stacks on undo and redo', () => {
    const edited = reduceProjectHistory(START, rename('B'));
    const undone = reduceProjectHistory(edited, { kind: 'undo' });
    expect(undone).toEqual({ past: [], present: named('A'), future: [named('B')] });
    expect(reduceProjectHistory(undone, { kind: 'redo' })).toEqual(edited);
  });

  it('does nothing on undo or redo with an empty stack', () => {
    expect(reduceProjectHistory(START, { kind: 'undo' })).toBe(START);
    expect(reduceProjectHistory(START, { kind: 'redo' })).toBe(START);
  });

  it('empties both stacks on replace', () => {
    const history: ProjectHistory = {
      past: [named('P')],
      present: named('A'),
      future: [named('F')],
    };
    expect(reduceProjectHistory(history, { kind: 'replace', project: named('N') })).toEqual({
      past: [],
      present: named('N'),
      future: [],
    });
  });

  it('never mutates the input', () => {
    const history: ProjectHistory = { past: [named('P')], present: named('A'), future: [] };
    const snapshot = structuredClone(history);
    reduceProjectHistory(history, rename('B'));
    reduceProjectHistory(history, { kind: 'undo' });
    expect(history).toEqual(snapshot);
  });
});
