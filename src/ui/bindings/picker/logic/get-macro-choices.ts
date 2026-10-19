import { MACRO_OPTIONS } from '@catalog/bindings';
import { getMacroLabel } from '@domain/advanced-keymap';
import type { Macro } from '@domain';
import type { ChoiceGroup } from './slot-choices';

export function getMacroChoices(macros: readonly Macro[]): readonly ChoiceGroup[] {
  return macros.length === 0
    ? []
    : [
        {
          id: 'macros',
          label: 'Macros',
          items: macros.map((macro) => ({
            id: macro.id,
            legend: `&${getMacroLabel(macro)}`,
            fullLegend: `&${getMacroLabel(macro)}`,
            name: macro.name,
            description: MACRO_OPTIONS.description,
            codes: [getMacroLabel(macro)],
            docsUrl: MACRO_OPTIONS.docsUrl,
            pick: { kind: 'macro', macroId: macro.id },
          })),
        },
      ];
}
