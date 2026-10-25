import { describe, expect, it } from 'vitest';
import { createProject } from '@domain/project';
import { addBehavior, createBehaviorBinding } from '@domain/behaviors';
import { parseProjectFile, serializeProject } from '@storage/project';
import fixture from '../../../fixtures/project/v8-behaviors-legacy.json?raw';
import { getResultValue } from '../../../helpers/result';

describe('016 project compatibility', () => {
  it('migrates v8 without losing its firmware or bindings', () => {
    const result = parseProjectFile(fixture);
    expect(result.ok).toBe(true);
    expect(getResultValue(result)).toEqual({
      ...JSON.parse(fixture),
      schemaVersion: 13,
      encoders: [],
      combos: [],
      macros: [],
      conditionalLayers: [],
      behaviors: [],
    });
  });
  it('round trips five types and dangling assignments', () => {
    let project = createProject({ controllerId: 'nice_nano_v2' });
    for (const kind of [
      'hold-tap',
      'tap-dance',
      'mod-morph',
      'sticky-key',
      'sticky-layer',
    ] as const) {
      project = addBehavior(project, { kind, name: kind });
    }
    expect(parseProjectFile(getResultValue(serializeProject(project)))).toEqual({
      ok: true,
      value: project,
    });
    const dangling = {
      ...project,
      keys: [{ id: 'k0', xU: 0, yU: 0 }],
      layers: [{ id: 'l0', name: 'Base', bindings: { k0: createBehaviorBinding(project, 'b99') } }],
    };
    expect(parseProjectFile(getResultValue(serializeProject(dangling)))).toEqual({
      ok: true,
      value: dangling,
    });
  });
  it.each([
    null,
    {},
    [{ id: 'b0', kind: 'hold-tap', name: 'Missing properties' }],
    Array.from({ length: 129 }, () => ({ id: 'b0' })),
  ])('rejects malformed or excessive definitions %j', (behaviors) => {
    expect(
      parseProjectFile(
        JSON.stringify({ ...createProject({ controllerId: 'nice_nano_v2' }), behaviors }),
      ).ok,
    ).toBe(false);
  });
});
