import { expect, it } from 'vitest';
import { editWiring } from '@domain/wiring/editing';
import { deriveWiring } from '@domain/wiring/matrix';
import { getKeyCorners } from '@domain/geometry';
import { createLayoutPresetProject } from '@domain/project';
import { KEYBOARD_PRESETS } from '@catalog/presets';
import type { Project } from '@domain';
import { getControllerFixtures } from '../../../../helpers/controller-fixtures';
import { getDefinedValue } from '../../../../helpers/defined-value';
import { getResultValue } from '../../../../helpers/result';

const { boards } = getControllerFixtures();
const board = getDefinedValue(boards[0]);
function auto(project: Project) {
  return editWiring(project, { kind: 'auto', gridStepU: 1, board });
}

for (const presetId of ['macropad-9', 'corne-42', 'lily58-58']) {
  it(`places ${presetId} outputs outside every rotated key and permits independent split GPIOs`, () => {
    const preset = getDefinedValue(KEYBOARD_PRESETS.find((entry) => entry.id === presetId));
    const project = createLayoutPresetProject({
      preset,
      bindingMode: 'qwerty',
      controllerId: board.id,
    });
    const proposed = getResultValue(auto(project));
    expect(proposed.layers).toEqual(project.layers);
    expect(deriveWiring(proposed, board).ok).toBe(true);
    expectClearOutputs(proposed);
    expectIndependentPins(proposed);
  });
}

function expectClearOutputs(project: Project, options?: { readonly pointOnly: true }) {
  const width = options?.pointOnly === true ? 0 : 2;
  const height = options?.pointOnly === true ? 0 : 0.25;
  const corners = project.keys.map((key) => getKeyCorners(key));
  const endpoints = terminalOutputs(project);
  for (const end of endpoints) {
    for (const points of corners) {
      const xs = points.map((point) => point.xU);
      const ys = points.map((point) => point.yU);
      const overlaps =
        end.at.xU + width > Math.min(...xs) &&
        end.at.xU < Math.max(...xs) &&
        end.at.yU + height > Math.min(...ys) &&
        end.at.yU - height < Math.max(...ys);
      expect(overlaps).toBe(false);
    }
  }
}
function expectIndependentPins(project: Project) {
  for (const half of new Set(project.keys.map((key) => key.half ?? 'left'))) {
    const pins = project.wiring?.terminals
      .filter((terminal) => terminal.half === half)
      .map((terminal) => terminal.boardPin);
    expect(pins?.[0]).toBe(0);
    expect(new Set(pins).size).toBe(pins?.length);
  }
}

it('puts right row endpoints beyond the right half', () => {
  const preset = getDefinedValue(KEYBOARD_PRESETS.find((entry) => entry.id === 'corne-42'));
  const project = getResultValue(
    auto(createLayoutPresetProject({ preset, bindingMode: 'qwerty', controllerId: board.id })),
  );
  const maxX = Math.max(
    ...project.keys
      .filter((key) => key.half === 'right')
      .flatMap((key) => getKeyCorners(key).map((point) => point.xU)),
  );
  const ids = new Set(
    getDefinedValue(project.wiring)
      .terminals.filter((terminal) => terminal.half === 'right')
      .filter((terminal) => terminal.kind === 'row')
      .map((terminal) => terminal.id),
  );
  const ends = terminalOutputs(project).filter((end) => ids.has(end.terminalId));
  expect(ends.length).toBeGreaterThan(0);
  expect(ends.map((end) => end.at.xU).every((xU) => xU >= maxX + 2.5)).toBe(true);
});

it('keeps compact column outputs above each half rather than using legacy bottom fanout', () => {
  const project = createSplitKeys({ left: { xU: 0, yU: 5 }, right: { xU: 0, yU: 0 } });
  const proposed = getResultValue(auto(project));
  expect(columnOutput(proposed, 'left').yU).toBe(4.5);
  expect(columnOutput(proposed, 'right').yU).toBe(-0.5);
  expect(getResultValue(auto(project))).toEqual(proposed);
});

it('uses fixed symmetric row padding and keeps output points outside both halves', () => {
  const proposed = getResultValue(
    auto(createSplitKeys({ left: { xU: 0, yU: 0 }, right: { xU: -4, yU: 0 } })),
  );
  const id = getDefinedValue(
    proposed.wiring?.terminals
      .filter((terminal) => terminal.half === 'left')
      .find((terminal) => terminal.kind === 'row'),
  ).id;
  const end = getDefinedValue(
    proposed.wires
      .flatMap((wire) => [wire.start, wire.end])
      .filter((entry) => entry.kind === 'free')
      .find((entry) => entry.terminalId === id),
  );
  expect(end.at).toEqual({ xU: -2.5, yU: 0 });
  expectClearOutputs(proposed, { pointOnly: true });
});

function createSplitKeys(input: {
  readonly left: { readonly xU: number; readonly yU: number };
  readonly right: { readonly xU: number; readonly yU: number };
}): Project {
  return {
    schemaVersion: 14,
    controllerId: board.id,
    name: 'Output spacing',
    keys: [
      { id: 'k0', ...input.left, half: 'left' },
      { id: 'k1', ...input.right, half: 'right' },
    ],
    wires: [],
    insulatedCrossings: [],
    encoders: [],
    combos: [],
    macros: [],
    conditionalLayers: [],
    behaviors: [],
    firmware: {},
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
    wiring: { kind: 'matrix', topology: 'split', diodeDirection: 'col2row', terminals: [] },
  };
}
function columnOutput(project: Project, half: 'left' | 'right') {
  const id = getDefinedValue(
    project.wiring?.terminals.find((terminal) => terminal.half === half && terminal.kind === 'col'),
  ).id;
  return getDefinedValue(
    project.wires
      .flatMap((wire) => [wire.start, wire.end])
      .filter((entry) => entry.kind === 'free')
      .find((entry) => entry.terminalId === id),
  ).at;
}

// Labels are short, unscaled SVG text above row wires; browser tests inspect their paint.
// The close split fixture checks output points; preset fixtures retain conservative label clearance.
function terminalOutputs(project: Project) {
  return project.wires.flatMap((wire) =>
    [wire.start, wire.end].flatMap((end) =>
      end.kind === 'free' && end.terminalId !== undefined
        ? [{ at: end.at, terminalId: end.terminalId }]
        : [],
    ),
  );
}
