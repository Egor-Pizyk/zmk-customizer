import { expect, it } from 'vitest';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { addBehavior } from '@domain/behaviors';
import {
  addMacro,
  getMacroBudget,
  hasReferenceCycle,
  validateAdvancedKeymap,
} from '@domain/advanced-keymap';
import { getDefinedValue } from '../../../helpers/defined-value';
import type { Binding, Project } from '@domain';

const ref: Binding = { kind: 'macro', macroId: 'm1' };
const custom: Binding = { kind: 'custom', behaviorId: 'b0', parameters: [] };
const base = addBehavior(addMacro(UNIBODY_PRESET, { name: 'Sequence' }), {
  name: 'Dance',
  kind: 'tap-dance',
});
const macro = getDefinedValue(base.macros[0]);
const dance = {
  id: 'b0',
  name: 'Dance',
  kind: 'tap-dance' as const,
  tappingTermMs: 200,
  bindings: [{ id: 'a0', binding: ref }],
};

it('checks macro references in named actions and rejects combined recursion', () => {
  const missing = { ...base, macros: [], behaviors: [dance] };
  expect(validateAdvancedKeymap(missing, BINDINGS_CATALOG)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'macro-reference-missing',
        path: ['behaviors', 0, 'bindings', 0],
      }),
    ]),
  );
  const recursive = {
    ...base,
    behaviors: [dance],
    macros: [{ ...macro, steps: [{ id: 's1', kind: 'tap' as const, binding: custom }] }],
  };
  expect(hasReferenceCycle(recursive, 'macro:m1')).toBe(true);
  expect(
    validateAdvancedKeymap(recursive, BINDINGS_CATALOG).filter(
      (issue) => issue.code === 'advanced-reference-cycle',
    ),
  ).toHaveLength(2);
  expect(
    getMacroBudget(recursive, getDefinedValue(recursive.macros[0]), 64).queueEntries,
  ).toBeGreaterThan(64);
});

it('memoizes shared acyclic actions and includes nested queue costs', () => {
  const project = {
    ...base,
    behaviors: [dance],
    macros: [
      ...base.macros,
      {
        ...macro,
        id: 'm2',
        name: 'Outer',
        steps: [
          { id: 's1', kind: 'tap' as const, binding: custom },
          { id: 's2', kind: 'press' as const, binding: custom },
        ],
      },
    ],
  };
  const outer = getDefinedValue(project.macros[1]);
  expect(hasReferenceCycle(project, 'macro:m2')).toBe(false);
  expect(getMacroBudget(project, outer, 64)).toEqual({ bindingCount: 4, queueEntries: 7 });
  const repeated = {
    ...outer,
    steps: [
      { id: 's1', kind: 'tap' as const, binding: ref },
      { id: 's2', kind: 'tap' as const, binding: ref },
    ],
  };
  expect(getMacroBudget(project, repeated, 64).queueEntries).toBe(8);
  expect(
    getMacroBudget(
      project,
      { ...macro, steps: [{ id: 's1', kind: 'tap', binding: { kind: 'macro', macroId: 'm9' } }] },
      64,
    ).queueEntries,
  ).toBe(2);
  expect(
    getMacroBudget(
      project,
      { ...macro, steps: [{ id: 's1', kind: 'tap', binding: { ...custom, behaviorId: 'b9' } }] },
      64,
    ).queueEntries,
  ).toBe(2);
});

it('detects invalid macro names, timing and pauses without discarding drafts', () => {
  const project: Project = {
    ...base,
    macros: [
      { ...macro, name: '!!!', tapMs: 5001, steps: [{ id: 's1', kind: 'wait', durationMs: 0.5 }] },
      { ...macro, id: 'm2', name: ' !!! ' },
    ],
  };
  const messages = validateAdvancedKeymap(project, BINDINGS_CATALOG)
    .map((issue) => issue.message)
    .join(' ');
  expect(messages).toContain('unique name');
  expect(messages).toContain('tap duration');
  expect(messages).toContain('pause durations');
  expect(project.macros[0]?.steps[0]).toEqual({ id: 's1', kind: 'wait', durationMs: 0.5 });
});
