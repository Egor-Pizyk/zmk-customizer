import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { createWiringProposal } from '@domain/wiring/editing';
import type { WiringEdit } from '@domain/wiring/editing';
import { getRoutingSettings } from '@domain/wiring';
import { getNets } from '@domain/wires/nets';
import type { Project, WiringProposalResult } from '@domain';
import { buildProject } from '../../../../helpers/build-project';

it('uses a pending Direct choice when one Generate command supersedes its calculation', () => {
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const generation = request(source);
  const candidate = changed(
    createWiringProposal(source, [
      { kind: 'mode', mode: 'direct', board: generation.board },
      generation,
    ]),
  );
  expect(candidate.wiring?.kind).toBe('direct');
  expect(candidate.wires).toHaveLength(2);
  expect(candidate.wiring?.terminals.filter((terminal) => terminal.kind === 'input')).toHaveLength(
    1,
  );
  expect(getNets(candidate).flatMap((net) => net.boardPins)).toHaveLength(1);
  expect(source.wires).toEqual([]);
});

it('refuses a partial legacy Direct generation instead of silently rebuilding the whole keyboard', () => {
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const generation = request(source);
  const proposal = createWiringProposal(source, [
    { kind: 'mode', mode: 'direct', board: generation.board },
    { ...generation, input: { ...generation.input, scope: { kind: 'half', half: 'left' } } },
  ]);
  expect(proposal).toEqual({
    kind: 'refused',
    failure: {
      code: 'operation',
      wireIds: [],
      message:
        'Direct generation requires Whole schematic scope. Prettify supports the selected scope.',
    },
  });
  expect(source.wires).toEqual([]);
});

function request(source: Project): Extract<WiringEdit, { kind: 'regenerate' }> {
  return {
    kind: 'regenerate',
    board: getControllerBoard(source.controllerId),
    gridStepU: 0.25,
    input: { settings: getRoutingSettings(source), limits: ZMK_LIMITS, scope: { kind: 'all' } },
  };
}
function changed(result: WiringProposalResult): Project {
  if (result.kind !== 'changed') {
    throw new Error(JSON.stringify(result));
  }
  return result.candidate;
}
