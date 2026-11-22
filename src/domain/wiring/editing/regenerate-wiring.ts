import type { Project, Result, Wiring, WiringProposalFailure } from '@domain';
import { getRoutingSettings } from '@domain/wiring';
import { createWiringTargets } from './create-wiring-targets';
import { initializeWiring } from './initialize-wiring';
import { setRoutingSettings } from './set-routing-settings';
import { prepareRegeneration } from './prepare-regeneration';
import { routeRegeneration } from './route-matrix-buses';
import { finishRegeneration } from './finish-regeneration';
import type { WiringRegenerationInput, WiringRegeneration } from './regeneration-types';

export function regenerateWiring(
  base: Project,
  input: WiringRegenerationInput,
): Result<WiringRegeneration, WiringProposalFailure> {
  const initialized = initializeRegeneration(base, input);
  if (!initialized.ok) {
    return refused('operation', initialized.error);
  }
  const normalized = { ...input, settings: getRoutingSettings(initialized.value) };
  const targets = createWiringTargets(initialized.value, {
    ...normalized,
    ...(normalized.settings.rowPin === undefined ? {} : { rowPin: normalized.settings.rowPin }),
  });
  if (!targets.ok) {
    return refused('operation', targets.error);
  }
  const prepared = prepareRegeneration(initialized.value, normalized, targets.value);
  if (!prepared.ok) {
    return refused('resources', prepared.error);
  }
  const routed = routeRegeneration(prepared.value, {
    cells: targets.value.cells,
    settings: normalized.settings,
    keyIds: targets.value.scope.keyIds,
    pinIds: targets.value.scope.pinIds,
    existingIds: base.wires.map((wire) => wire.id),
  });
  if (!routed.ok) {
    return refused('operation', routed.error);
  }
  const result = finishRegeneration(base, routed.value.project, {
    cells: targets.value.cells,
    keyIds: targets.value.scope.keyIds,
    pinIds: targets.value.scope.pinIds,
  });
  return result.ok
    ? { ok: true, value: { project: result.value, warnings: routed.value.warnings } }
    : result;
}

function initializeRegeneration(
  base: Project,
  input: WiringRegenerationInput,
): Result<Project & { readonly wiring: Wiring }, string> {
  if (base.keys.length === 0) {
    return { ok: false, error: 'Add keys before generating wiring.' };
  }
  const configured = setRoutingSettings(base, input);
  if (!configured.ok) {
    return { ok: false, error: configured.error.map((issue) => issue.message).join(' ') };
  }
  const initialized = initializeWiring(configured.value, input.board);
  const source =
    base.wiring === undefined && base.keys.some((key) => key.half === 'right')
      ? { ...initialized, wiring: { ...initialized.wiring, topology: 'split' as const } }
      : initialized;
  if (source.wiring.kind !== 'matrix' || (source.wiring.topology === 'split' && !input.board.ble)) {
    return {
      ok: false,
      error: 'Choose a supported matrix topology and controller before generating buses.',
    };
  }
  return { ok: true, value: source };
}

function refused(
  code: WiringProposalFailure['code'],
  message: string,
): Result<never, WiringProposalFailure> {
  return { ok: false, error: { code, message, wireIds: [] } };
}
