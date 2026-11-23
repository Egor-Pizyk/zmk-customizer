import { applyWiringProposal } from '@domain/wiring/editing';
import type { WiringProposalFailure } from '@domain';
import type { Commit } from '@ui/schematic/interaction';
import { STALE_WIRING_MESSAGE } from './wiring-preview-state';
import type { WiringPreviewDraft, WiringPreviewState } from './wiring-preview-state';

type Input = WiringPreviewState & {
  readonly commit: Commit;
  readonly announce: (text: string) => void;
};

export function applyWiringPreview(draft: WiringPreviewDraft | undefined, input: Input) {
  if (
    draft?.phase !== 'ready' ||
    draft.result?.kind !== 'changed' ||
    !input.session.claim(draft.request)
  ) {
    return;
  }
  const proposal = draft.result;
  const outcome: { failure?: WiringProposalFailure } = {};
  input.commit((current) => {
    if (!input.session.isCurrent(draft.request) || input.getRevision() !== draft.revision) {
      outcome.failure = { code: 'stale', message: STALE_WIRING_MESSAGE, wireIds: [] };
      return current;
    }
    const result = applyWiringProposal(current, { base: draft.base, proposal });
    if (!result.ok) {
      outcome.failure = result.error;
      return current;
    }
    return result.value;
  }, 'Applied wiring. Undo');
  if (outcome.failure !== undefined) {
    input.announce(outcome.failure.message);
    input.setDraft((current) =>
      current?.request === draft.request ? { ...current, phase: 'stale' } : current,
    );
    return;
  }
  input.session.cancel();
  input.setDraft(undefined);
  input.session.restoreFocus();
}
