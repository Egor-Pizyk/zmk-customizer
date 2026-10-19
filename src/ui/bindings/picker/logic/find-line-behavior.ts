import { getMacroLabel } from '@domain/advanced-keymap';
import { BEHAVIORS, CUSTOM_BEHAVIOR_TYPES, MACRO_OPTIONS } from '@catalog/bindings';
import type { BehaviorEntry } from '@catalog/bindings';
import type { CustomBehavior, Macro } from '@domain';
import { getBehaviorLabel } from '@domain/behaviors';
import type { LineSource } from './binding-slots';

export type LineBehavior = Omit<BehaviorEntry, 'id'> & { readonly id: string };
export function findLineBehavior(
  source: LineSource,
  behaviors: readonly CustomBehavior[] = [],
  macros: readonly Macro[] = [],
): LineBehavior | undefined {
  if (source.kind === 'binding' && source.binding.kind === 'macro') {
    const binding = source.binding;
    const macro = macros.find((entry) => entry.id === binding.macroId);
    return {
      id: binding.macroId,
      tag: macro === undefined ? `?${binding.macroId}` : `&${getMacroLabel(macro)}`,
      label: macro?.name ?? 'Deleted macro',
      description: MACRO_OPTIONS.description,
      docsUrl: MACRO_OPTIONS.docsUrl,
      group: 'Your behaviors',
    };
  }
  if (source.kind === 'binding' && source.binding.kind === 'custom') {
    const binding = source.binding;
    const behavior = behaviors.find((entry) => entry.id === binding.behaviorId);
    const entry = CUSTOM_BEHAVIOR_TYPES.find((item) => item.kind === behavior?.kind);
    return {
      id: source.binding.behaviorId,
      tag:
        behavior === undefined ? `?${source.binding.behaviorId}` : `&${getBehaviorLabel(behavior)}`,
      label: behavior?.name ?? 'Deleted behavior',
      description: entry?.description ?? 'Choose an existing behavior.',
      docsUrl: entry?.docsUrl ?? CUSTOM_BEHAVIOR_TYPES[0].docsUrl,
      group: 'Your behaviors',
    };
  }
  if (source.kind === 'none') {
    return undefined;
  }
  const behaviorId = source.kind === 'draft' ? source.draft.behaviorId : source.binding.kind;
  return BEHAVIORS.find((behavior) => behavior.id === behaviorId);
}
