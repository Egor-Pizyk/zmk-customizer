import { useLayoutPreview } from '@ui/schematic/layout/logic';
import { useWiringPreview } from '@ui/schematic/wiring/logic';
import type { Project } from '@domain';
import type { Commit, SchematicSelection } from '@ui/schematic/interaction';

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
