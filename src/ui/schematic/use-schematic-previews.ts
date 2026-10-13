import { useLayoutPreview } from './layout/use-layout-preview';
import { useWiringPreview } from './wiring/use-wiring-preview';
import type { Project } from '@domain';
import type { Commit } from './interaction/pointer-types';
import type { SchematicSelection } from './interaction/schematic-selection';

export function useSchematicPreviews(
  project: Project,
  selection: SchematicSelection | undefined,
  input: { readonly commit: Commit; readonly pointer: { readonly cancelDraft: () => void } },
) {
  const layout = useLayoutPreview(project, selection, input.commit);
  const wiring = useWiringPreview(project, input.commit, () => {
    layout.handleCancel();
    input.pointer.cancelDraft();
  });
  return {
    wiring,
    layout: {
      ...layout,
      handlePreview: (...args: Parameters<typeof layout.handlePreview>) => {
        wiring.handleCancel();
        layout.handlePreview(...args);
      },
    },
    keyboardLayout: {
      ...layout,
      hasPreview: layout.hasPreview || wiring.hasPreview,
      handleCancel: () => {
        layout.handleCancel();
        wiring.handleCancel();
      },
    },
  };
}
