import { expect, it } from 'vitest';
import { UNIBODY_PRESET } from '@catalog/presets';
import {
  addMacro,
  replaceMacro,
  removeMacro,
  addMacroStep,
  moveMacroStep,
  removeMacroStep,
  validateAdvancedKeymap,
} from '@domain/advanced-keymap';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { getDefinedValue } from '../../../helpers/defined-value';

it('keeps stable ordered step identities while adding/reordering/removing', () => {
  let project = addMacro(UNIBODY_PRESET, { name: 'Sequence' });
  project = addMacroStep(project, { macroId: 'm1', kind: 'wait' });
  project = moveMacroStep(project, { macroId: 'm1', stepId: 's2', direction: -1 });
  expect(project.macros[0]?.steps.map((step) => step.id)).toEqual(['s2', 's1']);
  expect(removeMacroStep(project, { macroId: 'm1', stepId: 's1' }).macros[0]?.steps).toEqual([
    { id: 's2', kind: 'wait', durationMs: 100 },
  ]);
  expect(UNIBODY_PRESET.macros).toEqual([]);
});
it('preserves deleted macro references and reserves their IDs', () => {
  const added = addMacro(UNIBODY_PRESET, { name: 'Sequence' });
  const bound = {
    ...added,
    layers: [
      {
        ...getDefinedValue(added.layers[0]),
        bindings: {
          ...getDefinedValue(added.layers[0]).bindings,
          k0: { kind: 'macro' as const, macroId: 'm1' },
        },
      },
      ...added.layers.slice(1),
    ],
  };
  const removed = removeMacro(bound, 'm1');
  expect(validateAdvancedKeymap(removed, BINDINGS_CATALOG)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'macro-reference-missing',
        path: ['layers', 0, 'bindings', 'k0'],
      }),
    ]),
  );
  expect(addMacro(removed, { name: 'Other' }).macros[0]?.id).toBe('m2');
});
it('rejects empty/timing/queue overflow and circular macro steps', () => {
  const project = addMacro(UNIBODY_PRESET, { name: 'Sequence' });
  const macro = getDefinedValue(project.macros[0]);
  expect(
    validateAdvancedKeymap(
      replaceMacro(project, { ...macro, waitMs: -1, steps: [] }),
      BINDINGS_CATALOG,
    ).length,
  ).toBeGreaterThanOrEqual(2);
  const cycle = replaceMacro(project, {
    ...macro,
    steps: [{ id: 's1', kind: 'tap', binding: { kind: 'macro', macroId: 'm1' } }],
  });
  expect(validateAdvancedKeymap(cycle, BINDINGS_CATALOG).map((issue) => issue.code)).toContain(
    'advanced-reference-cycle',
  );
  const long = replaceMacro(project, {
    ...macro,
    steps: Array.from({ length: 33 }, (_, index) => ({
      id: `s${index}`,
      kind: 'tap' as const,
      binding: { kind: 'kp' as const, key: { keycode: 'A', modifiers: [] } },
    })),
  });
  expect(validateAdvancedKeymap(long, BINDINGS_CATALOG).map((issue) => issue.code)).toContain(
    'macro-invalid',
  );
});
