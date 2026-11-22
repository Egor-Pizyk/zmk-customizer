import { useLayoutPreview } from '@ui/schematic/layout/logic';
import { useWiringPreview } from '@ui/schematic/wiring/logic';
import type { Project } from '@domain';
import type { Commit, SchematicSelection } from '@ui/schematic/interaction';

export function useSchematicPreviews(
  project: Project,
  selection: SchematicSelection | undefined,
  input: {
    readonly commit: Commit;
    readonly pointer: { readonly cancelDraft: () => void };
    readonly announce: (text: string) => void;
    readonly onWiringStart: () => void;
  },
) {
  const layout = useLayoutPreview(project, selection, input.commit);
  const proposal = useWiringPreview(project, input.commit, () => {
    input.onWiringStart();
    layout.handleCancel();
    input.pointer.cancelDraft();
  });
  const wiring = { ...proposal, handleCancel: createCancelHandler(proposal, input.announce) };
  return {
    wiring,
    layout: {
      ...layout,
      handlePreview: (...args: Parameters<typeof layout.handlePreview>) => {
        input.pointer.cancelDraft();
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

function createCancelHandler(
  wiring: ReturnType<typeof useWiringPreview>,
  announce: (text: string) => void,
) {
  return () => {
    if (wiring.hasPreview) {
      announce('Wiring preview cancelled. Saved wiring restored.');
    }
    wiring.handleCancel();
  };
}
