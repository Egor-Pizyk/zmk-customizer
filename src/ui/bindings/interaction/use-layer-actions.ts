import { BINDINGS_CATALOG } from '@catalog/bindings';
import { addLayer, moveLayer, removeLayer, renameLayer } from '@domain';
import type { Project, ValidationIssue } from '@domain';
import { usePreferences } from '@ui/preferences';

type LayerActionsOptions = {
  readonly project: Project;
  readonly layerIndex: number;
  readonly reservedLayerIds: readonly string[];
  readonly issues: readonly ValidationIssue[];
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
};

// Unavailable actions say why (spec 007 FR-003); undefined = available.
function findBlockReasons(project: Project, layerIndex: number) {
  const lastIndex = project.layers.length - 1;
  return {
    add:
      project.layers.length >= BINDINGS_CATALOG.maxLayerCount
        ? `ZMK v0.3 supports at most ${BINDINGS_CATALOG.maxLayerCount} layers`
        : undefined,
    delete: lastIndex === 0 ? 'A keymap needs at least one layer' : undefined,
    moveLeft: layerIndex === 0 ? 'Already the first layer' : undefined,
    moveRight: layerIndex === lastIndex ? 'Already the last layer' : undefined,
  };
}

// Each change is one commit, one undo step (FR-002); the open layer follows the changed one.
function createLayerHandlers(
  options: LayerActionsOptions & {
    readonly layerIndex: number;
    readonly onOpen: (layerIndex: number) => void;
  },
) {
  const { project, commit, layerIndex, onOpen } = options;
  const blockReasons = findBlockReasons(project, layerIndex);
  const layerName = project.layers[layerIndex]?.name ?? '';
  return {
    blockReasons,
    handleLayerAdd: () => {
      if (blockReasons.add === undefined) {
        const input = { reservedLayerIds: options.reservedLayerIds };
        const name = addLayer(project, input).layers.at(-1)?.name ?? '';
        commit((current) => addLayer(current, input), `Added layer ${name}`);
        onOpen(project.layers.length);
      }
    },
    handleLayerRename: (name: string) => {
      commit((current) => renameLayer(current, { layerIndex, name }), `Renamed layer to ${name}`);
    },
    handleLayerMove: (offset: -1 | 1) => {
      const toIndex = layerIndex + offset;
      const reason = offset < 0 ? blockReasons.moveLeft : blockReasons.moveRight;
      if (reason === undefined) {
        const text = `Moved layer ${layerName} to position ${toIndex}`;
        commit((current) => moveLayer(current, { layerIndex, toIndex }), text);
        onOpen(toIndex);
      }
    },
    // Runs at once with an undo hint; the layer that takes its position opens (admin-ui.md).
    handleLayerDelete: () => {
      if (blockReasons.delete === undefined) {
        const text = `Deleted layer ${layerName}. Undo`;
        commit((current) => removeLayer(current, { layerIndex }), text);
      }
    },
  };
}

// The workspace clamps the preferred position (spec 007 R6); copied targets reserve ids
// even when no project binding points at them anymore.
export function useLayerActions(options: LayerActionsOptions) {
  const { changePreferences } = usePreferences();
  const { layerIndex } = options;

  function handleLayerOpen(index: number) {
    changePreferences({ bindingsLayerIndex: index });
  }

  return {
    layerIndex,
    /** The open layer's first name problem, shown at the name field (FR-006). */
    nameError: options.issues.find((issue) => issue.path.join('.') === `layers.${layerIndex}.name`)
      ?.message,
    handleLayerOpen,
    ...createLayerHandlers({ ...options, layerIndex, onOpen: handleLayerOpen }),
  };
}

export type LayerActions = ReturnType<typeof useLayerActions>;
