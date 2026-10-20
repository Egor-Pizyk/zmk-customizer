import { getProjectJson } from './get-project-json';
import { getWireSegmentCount } from '@domain/wires/geometry';
import { findAdvancedResourceError } from './find-advanced-resource-error';
import type { Project } from '@domain';
import { PROJECT_BUDGET } from './project-budget';

/** Resource failures are edit refusals, unlike repairable electrical conflicts. */
export function getProjectResourceError(project: Project): string | undefined {
  const behaviorError = findBehaviorResourceError(project) ?? findAdvancedResourceError(project);
  if (behaviorError !== undefined) {
    return behaviorError;
  }
  const limits = [
    [project.encoders.length, 16, 'encoders'],
    [Object.keys(project.firmware).length, PROJECT_BUDGET.firmwareOptions, 'firmware overrides'],
    [project.keys.length, PROJECT_BUDGET.keys, 'keys'],
    [project.wires.length, PROJECT_BUDGET.wires, 'wires'],
    [project.layers.length, PROJECT_BUDGET.layers, 'layers'],
    [project.insulatedCrossings.length, PROJECT_BUDGET.crossings, 'insulated crossings'],
    [project.wiring?.terminals.length ?? 0, PROJECT_BUDGET.wires, 'wiring terminals'],
  ] as const;
  for (const [count, limit, name] of limits) {
    if (count > limit) {
      return `Project exceeds ${limit} ${name}. Remove some before adding more.`;
    }
  }
  for (const wire of project.wires) {
    if (wire.bends.length > PROJECT_BUDGET.bendsPerWire) {
      return `A wire can have at most ${PROJECT_BUDGET.bendsPerWire} bends. Remove a bend first.`;
    }
  }
  const segments = getWireSegmentCount(project);
  if (segments > PROJECT_BUDGET.segments) {
    return `Project exceeds ${PROJECT_BUDGET.segments} wire segments. Simplify the wiring.`;
  }
  const oversizedFirmware = Object.values(project.firmware).some(
    (value) => typeof value === 'string' && value.length > PROJECT_BUDGET.firmwareStringLength,
  );
  if (oversizedFirmware) {
    return `Firmware text exceeds ${PROJECT_BUDGET.firmwareStringLength} characters. Shorten it before applying.`;
  }
  return findCollectionError(project) ?? findStringError(project) ?? findByteError(project);
}

function findCollectionError(project: Project): string | undefined {
  for (const layer of project.layers) {
    if (Object.keys(layer.bindings).length > PROJECT_BUDGET.keys) {
      return `A layer can have at most ${PROJECT_BUDGET.keys} bindings.`;
    }
    for (const binding of Object.values(layer.bindings)) {
      if (binding.kind === 'tap_dance' && binding.taps.length > PROJECT_BUDGET.taps) {
        return `A tap dance can have at most ${PROJECT_BUDGET.taps} taps.`;
      }
    }
  }
  for (const half of ['left', 'right']) {
    const terminals = project.wiring?.terminals.filter((terminal) => terminal.half === half) ?? [];
    const cells =
      terminals.filter((terminal) => terminal.kind === 'row').length *
      terminals.filter((terminal) => terminal.kind === 'col').length;
    if (cells > PROJECT_BUDGET.crossings) {
      return `Matrix exceeds ${PROJECT_BUDGET.crossings} cells. Reduce its dimensions.`;
    }
  }
  return undefined;
}

function findByteError(project: Project): string | undefined {
  const text = getProjectJson(project);
  return new TextEncoder().encode(text).length > PROJECT_BUDGET.bytes
    ? 'Project exceeds the saved JSON byte budget. Remove some content before adding more.'
    : undefined;
}

function findStringError(value: unknown, name = ''): string | undefined {
  if (typeof value === 'string') {
    let limit: number = PROJECT_BUDGET.stringLength;
    if (['id', 'keyId', 'wireId', 'layerId', 'terminalId'].includes(name)) {
      limit = PROJECT_BUDGET.idLength;
    }
    if (name === 'droppedBoardPin') {
      limit = 160;
    }
    return value.length > limit
      ? `${name || 'Text'} exceeds ${limit} characters. Shorten it before applying.`
      : undefined;
  }
  if (typeof value !== 'object' || !value) {
    return undefined;
  }
  for (const [field, child] of Object.entries(value)) {
    const error = findStringError(child, field);
    if (error !== undefined) {
      return error;
    }
  }
  return undefined;
}

function findBehaviorResourceError(project: Project): string | undefined {
  if (project.behaviors.length > 128) {
    return 'A project can have at most 128 custom behaviors.';
  }
  for (const behavior of project.behaviors) {
    if (behavior.name.length > 160) {
      return 'Behavior names can have at most 160 characters.';
    }
    if (behavior.kind === 'tap-dance' && behavior.bindings.length > 32) {
      return 'A custom tap dance can have at most 32 actions.';
    }
    if (behavior.kind === 'hold-tap' && behavior.triggerKeyIds.length > 256) {
      return 'A hold-tap can have at most 256 trigger keys.';
    }
  }
  return undefined;
}
