import { expect, it } from 'vitest';
import { UNIBODY_PRESET } from '@catalog/presets';
import {
  addCombo,
  addMacro,
  addConditionalLayer,
  replaceCombo,
  replaceMacro,
  replaceConditionalLayer,
  removeCombo,
  removeMacro,
  removeConditionalLayer,
  addMacroStep,
  replaceMacroStep,
  setMacroStepKind,
  moveMacroStep,
  removeMacroStep,
} from '@domain/advanced-keymap';
import { getDefinedValue } from '../../../helpers/defined-value';

it('keeps missing and unchanged edits out of history', () => {
  const project = addConditionalLayer(
    addMacro(addCombo(UNIBODY_PRESET, { name: 'Escape', keyIds: [] }), { name: 'Sequence' }),
  );
  const combo = getDefinedValue(project.combos[0]);
  const macro = getDefinedValue(project.macros[0]);
  const rule = getDefinedValue(project.conditionalLayers[0]);
  expect(replaceCombo(project, combo)).toBe(project);
  expect(replaceCombo(project, { ...combo, id: 'c999' })).toBe(project);
  expect(replaceMacro(project, macro)).toBe(project);
  expect(replaceMacro(project, { ...macro, id: 'm999' })).toBe(project);
  expect(replaceConditionalLayer(project, rule)).toBe(project);
  expect(replaceConditionalLayer(project, { ...rule, id: 'q999' })).toBe(project);
  expect(removeCombo(project, 'c999')).toBe(project);
  expect(removeMacro(project, 'm999')).toBe(project);
  expect(removeConditionalLayer(project, 'q999')).toBe(project);
});

it('bounds collections and preserves immutable originals', () => {
  const project = addConditionalLayer(
    addMacro(addCombo(UNIBODY_PRESET, { name: 'Escape', keyIds: [] }), { name: 'Sequence' }),
  );
  const full = {
    ...project,
    combos: Array.from({ length: 128 }, (_, index) => ({
      ...getDefinedValue(project.combos[0]),
      id: `c${index}`,
    })),
    macros: Array.from({ length: 128 }, (_, index) => ({
      ...getDefinedValue(project.macros[0]),
      id: `m${index}`,
    })),
    conditionalLayers: Array.from({ length: 128 }, (_, index) => ({
      ...getDefinedValue(project.conditionalLayers[0]),
      id: `q${index}`,
    })),
  };
  expect(addCombo(full, { name: 'Other', keyIds: [] })).toBe(full);
  expect(addMacro(full, { name: 'Other' })).toBe(full);
  expect(addConditionalLayer(full)).toBe(full);
  expect(UNIBODY_PRESET.combos).toEqual([]);
  expect(
    addMacro(UNIBODY_PRESET, { name: 'Reserved', reservedIds: ['m9007199254740993'] }).macros[0]
      ?.id,
  ).toBe('m9007199254740994');
});

it('ignores stale step actions and out of range movements', () => {
  const project = addMacro(UNIBODY_PRESET, { name: 'Sequence' });
  const step = getDefinedValue(project.macros[0]?.steps[0]);
  expect(addMacroStep(project, { macroId: 'm9', kind: 'wait' })).toBe(project);
  expect(replaceMacroStep(project, { macroId: 'm9', step })).toBe(project);
  expect(replaceMacroStep(project, { macroId: 'm1', step: { ...step, id: 's9' } })).toBe(project);
  expect(setMacroStepKind(project, { macroId: 'm1', stepId: 's9', kind: 'press' })).toBe(project);
  expect(setMacroStepKind(project, { macroId: 'm1', stepId: 's1', kind: 'tap' })).toBe(project);
  expect(moveMacroStep(project, { macroId: 'm9', stepId: 's1', direction: 1 })).toBe(project);
  expect(moveMacroStep(project, { macroId: 'm1', stepId: 's9', direction: 1 })).toBe(project);
  expect(moveMacroStep(project, { macroId: 'm1', stepId: 's1', direction: -1 })).toBe(project);
  expect(moveMacroStep(project, { macroId: 'm1', stepId: 's1', direction: 1 })).toBe(project);
  expect(removeMacroStep(project, { macroId: 'm9', stepId: 's1' })).toBe(project);
});

it('converts pauses to actions and retains existing actions across modes', () => {
  const project = addMacroStep(addMacro(UNIBODY_PRESET, { name: 'Sequence' }), {
    macroId: 'm1',
    kind: 'wait',
  });
  const pressed = setMacroStepKind(project, { macroId: 'm1', stepId: 's2', kind: 'press' });
  expect(pressed.macros[0]?.steps[1]).toEqual({
    id: 's2',
    kind: 'press',
    binding: { kind: 'kp', key: { keycode: 'A', modifiers: [] } },
  });
  const released = setMacroStepKind(pressed, { macroId: 'm1', stepId: 's2', kind: 'release' });
  expect(released.macros[0]?.steps[1]).toMatchObject({
    id: 's2',
    kind: 'release',
    binding: { kind: 'kp' },
  });
  expect(
    setMacroStepKind(released, { macroId: 'm1', stepId: 's2', kind: 'wait' }).macros[0]?.steps[1],
  ).toEqual({ id: 's2', kind: 'wait', durationMs: 100 });
  const macro = getDefinedValue(project.macros[0]);
  const full = replaceMacro(project, {
    ...macro,
    steps: Array.from({ length: 64 }, (_, index) => ({
      id: `s${index}`,
      kind: 'wait' as const,
      durationMs: 0,
    })),
  });
  expect(addMacroStep(full, { macroId: 'm1', kind: 'tap' })).toBe(full);
});
