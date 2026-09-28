import { describe, expect, it } from 'vitest';
import fixtureV1 from '../../tests/fixtures/project/v1.json?raw';
import fixtureSmall from '../../tests/fixtures/schematic/small.json?raw';
import { parseProjectFile } from './parse-project-file';

function issuePathsOf(raw: string): readonly string[] {
  const result = parseProjectFile(raw);
  if (result.ok || result.error.kind !== 'not-project') {
    return [];
  }
  return result.error.issues.map((issue) => issue.path);
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
      value: { schemaVersion: 2, name: 'x', keys: [], wires: [], insulatedCrossings: [] },
    });
  });

  it('loads the v1 fixture as v2 with an empty schematic', () => {
    expect(parseProjectFile(fixtureV1)).toEqual({
      ok: true,
      value: {
        schemaVersion: 2,
        name: 'My Corne v2!',
        shieldName: 'corne',
        keys: [],
        wires: [],
        insulatedCrossings: [],
      },
    });
  });

  it('round-trips the v2 schematic fixture', () => {
    const expected: unknown = JSON.parse(fixtureSmall);
    expect(parseProjectFile(fixtureSmall)).toEqual({ ok: true, value: expected });
  });

  it('accepts a name that breaks project rules but is valid in shape', () => {
    expect(parseProjectFile(JSON.stringify({ schemaVersion: 1, name: 'x'.repeat(500) })).ok).toBe(
      true,
    );
  });
});
