import { expect, it } from 'vitest';
import { applyWiringProposal, prepareWiringProposal } from '@domain/wiring/editing';
import { buildProject } from '../../../../helpers/build-project';
import { buildLockedWiringProject } from '../../../../helpers/symmetric-wiring-fixtures';
import { getResultValue } from '../../../../helpers/result';
import type { Wire, WiringProposalResult } from '@domain';

it('represents an unchanged Worker clone without a candidate and preserves the original reference', () => {
  const base = buildProject({});
  const proposal = prepareWiringProposal(base, { ok: true, value: structuredClone(base) });
  expect(proposal.kind).toBe('no-change');
  expect('candidate' in proposal).toBe(false);
  expect(getResultValue(applyWiringProposal(base, { base, proposal }))).toBe(base);
});

it('shows and applies settings-only changes even when every conductor stays identical', () => {
  const base = buildProject({});
  const candidate = {
    ...base,
    routing: {
      matrixStyle: 'symmetric-bus',
      offsetU: 0.15,
      clearanceU: 0.1,
      fallbackRowIntervalU: 1,
      preferredScope: 'all',
    },
  } as const;
  const proposal = changed(prepareWiringProposal(base, { ok: true, value: candidate }));
  expect(proposal.summary.settingsChanged).toBe(true);
  expect(proposal.summary.added).toBe(0);
  expect(getResultValue(applyWiringProposal(base, { base, proposal }))).toBe(candidate);
});

it('rejects a different current base even when its serialized content is the same', () => {
  const base = buildProject({});
  const proposal = prepareWiringProposal(base, { ok: true, value: { ...base, name: 'Proposed' } });
  const current = structuredClone(base);
  expect(applyWiringProposal(current, { base, proposal })).toEqual({
    ok: false,
    error: {
      code: 'stale',
      message: 'The project changed. Recalculate the wiring preview.',
      wireIds: [],
    },
  });
});

it('refuses a protected candidate and preserves the full source', () => {
  const base = buildLockedWiringProject();
  const snapshot = structuredClone(base);
  const proposal = prepareWiringProposal(base, { ok: true, value: { ...base, wires: [] } });
  expect(proposal).toMatchObject({ kind: 'refused', failure: { code: 'locked', wireIds: ['w0'] } });
  expect(base).toEqual(snapshot);
});

it('checks the full candidate again rather than trusting an altered proposal', () => {
  const base = buildLockedWiringProject();
  const proposal = changed(
    prepareWiringProposal(base, { ok: true, value: { ...base, name: 'Proposed' } }),
  );
  const altered = { ...proposal, candidate: { ...proposal.candidate, wires: [] } };
  expect(applyWiringProposal(base, { base, proposal: altered })).toMatchObject({
    ok: false,
    error: { code: 'locked', wireIds: ['w0'] },
  });
});

it('refuses a resource overflow and keeps operation failures explicit', () => {
  const base = buildLockedWiringProject();
  const candidate = {
    ...base,
    wires: Array.from({ length: 601 }, (_, index): Wire => ({
      id: `w${index}`,
      start: { kind: 'free', at: { xU: 0, yU: index } },
      end: { kind: 'free', at: { xU: 1, yU: index } },
      bends: [],
    })),
  } as const;
  expect(prepareWiringProposal(base, { ok: true, value: candidate })).toMatchObject({
    kind: 'refused',
    failure: { code: 'resources' },
  });
  expect(prepareWiringProposal(base, { ok: false, error: 'Not enough GPIOs' })).toEqual({
    kind: 'refused',
    failure: { code: 'operation', message: 'Not enough GPIOs', wireIds: [] },
  });
});

function changed(proposal: WiringProposalResult) {
  if (proposal.kind !== 'changed') {
    throw new Error('Expected a changed proposal');
  }
  return proposal;
}

it('classifies wire objects independently of their number of geometric sections', () => {
  const base = { ...buildProject({}), wires: [wire('w0', 0), wire('w2', 4), wire('w3', 6)] };
  const candidate = {
    ...base,
    wires: [
      {
        ...wire('w0', 0),
        bends: [
          { xU: 0, yU: 1 },
          { xU: 1, yU: 1 },
        ],
      },
      wire('w1', 2),
      wire('w3', 6),
    ],
  };
  expect(
    changed(prepareWiringProposal(base, { ok: true, value: candidate })).summary.wireChanges,
  ).toEqual({ retained: ['w3'], added: ['w1'], changed: ['w0'], removed: ['w2'] });
});

const wire = (id: string, xU: number): Wire => ({
  id,
  start: { kind: 'free', at: { xU, yU: 0 } },
  end: { kind: 'free', at: { xU: xU + 1, yU: 0 } },
  bends: [],
});
