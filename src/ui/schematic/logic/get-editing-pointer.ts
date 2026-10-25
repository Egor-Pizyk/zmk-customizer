import { getWiringPreviewSelection, readCanvasHit } from '@ui/schematic/interaction';
import type {
  useEditingPointer,
  SchematicSelection,
  SelectionChange,
} from '@ui/schematic/interaction';
import type { Project } from '@domain';

type PreviewInput = {
  readonly hasLayoutPreview: boolean;
  readonly wiring: { readonly hasPreview: boolean; readonly previewProject: Project };
  readonly selection: SchematicSelection;
  readonly onSelectionChange: SelectionChange;
};

export function getEditingPointer(
  pointer: ReturnType<typeof useEditingPointer>,
  input: PreviewInput,
) {
  if (input.wiring.hasPreview) {
    return {
      ...pointer,
      hoverPreview: { draftPath: undefined, snapTarget: undefined, ghostKey: undefined },
      surfaceHandlers: {
        onPointerDown: (_world, event) => {
          input.onSelectionChange(
            getWiringPreviewSelection({
              project: input.wiring.previewProject,
              selection: input.selection,
              hit: readCanvasHit(event.target),
              shiftKey: event.shiftKey,
            }),
          );
        },
        onPointerMove: handleReadOnlyGesture,
        onPointerUp: handleReadOnlyGesture,
        onPointerCancel: handleReadOnlyGesture,
        onPointerLeave: handleReadOnlyGesture,
      } satisfies ReturnType<typeof useEditingPointer>['surfaceHandlers'],
    };
  }
  return input.hasLayoutPreview
    ? {
        ...pointer,
        surfaceHandlers: { ...pointer.surfaceHandlers, onPointerDown: handleReadOnlyGesture },
      }
    : pointer;
}

function handleReadOnlyGesture() {
  // Inspection cannot start or commit an editing gesture.
}
