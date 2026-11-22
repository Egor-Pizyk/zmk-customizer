import type { Project } from '@domain';
import { expect, it } from 'vitest';
import { createLayoutPresetProject } from '@domain/project';
import { editWiring } from '@domain/wiring/editing';
import { deriveWiring } from '@domain/wiring/matrix';
import { getNets } from '@domain/wires/nets';
import { KEYBOARD_PRESETS } from '@catalog/presets';
import { wiringBoard } from '../../../../helpers/wiring-project';
import { getResultValue } from '../../../../helpers/result';
import { getDefinedValue } from '../../../../helpers/defined-value';

for (const presetId of ['macropad-9', 'corne-42', 'lily58-58']) {
  it(`routes ${presetId} with complete separate nets and one output per line`, () => {
    const board = wiringBoard();
    const preset = getDefinedValue(KEYBOARD_PRESETS.find((entry) => entry.id === presetId));
    const original = createLayoutPresetProject({
      preset,
      bindingMode: 'qwerty',
      controllerId: board.id,
    });
    const result = getResultValue(editWiring(original, { kind: 'auto', gridStepU: 1, board }));
    const terminals = getDefinedValue(result.wiring).terminals;
    const nets = getNets(result);
    expect(deriveWiring(result, board).ok).toBe(true);
    expect(result.layers).toEqual(original.layers);
    expect(nets.flatMap((net) => net.pins)).toHaveLength(original.keys.length * 2);
    expect(nets.map((net) => net.terminalIds.length)).toEqual(terminals.map(() => 1));
    const ends = getOutputs(result);
    expect(ends.toSorted()).toEqual(terminals.map((terminal) => terminal.id).toSorted());
    expect(getResultValue(editWiring(original, { kind: 'auto', gridStepU: 1, board }))).toEqual(
      result,
    );
  });
}

function getOutputs(project: Project) {
  return project.wires
    .flatMap((wire) => [wire.start, wire.end])
    .flatMap((end) =>
      end.kind === 'free' && end.terminalId !== undefined ? [end.terminalId] : [],
    );
}
