import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { usePreferences } from '@ui/preferences';
import { getGenerationScope } from '@ui/schematic/wiring/logic';
import { Button } from '@ui/components/components';
import type { Project, RoutingSettings } from '@domain';
import type { WiringEdit } from '@domain/wiring/editing';
import type { SchematicSelection } from '@ui/schematic/interaction';

type Props = {
  readonly project: Project;
  readonly settings: RoutingSettings;
  readonly selection?: SchematicSelection;
  readonly hasPreview: boolean;
  readonly onEdit: (input: WiringEdit) => void;
};

export function WiringRoutingActions({
  project,
  selection,
  settings,
  hasPreview,
  onEdit: handleEdit,
}: Props) {
  const { gridSizeU } = usePreferences().preferences;
  function handleGenerate() {
    handleEdit(createRoutingEdit({ project, settings, selection, gridStepU: gridSizeU }));
  }

  const isScopedDirect = project.wiring?.kind === 'direct' && settings.preferredScope !== 'all';
  return (
    <fieldset aria-label="Wiring actions" className="flex flex-wrap gap-2">
      <Button
        variant={hasPreview ? 'secondary' : 'primary'}
        isDisabled={isScopedDirect}
        hint={isScopedDirect ? 'Direct generation requires Whole schematic scope.' : undefined}
        onClick={() => {
          handleGenerate();
        }}
      >
        Generate wiring
      </Button>
    </fieldset>
  );
}

function createRoutingEdit(
  context: Pick<Props, 'project' | 'settings' | 'selection'> & { readonly gridStepU: number },
): WiringEdit {
  const { project, settings, selection } = context;
  return {
    kind: 'regenerate',
    board: getControllerBoard(project.controllerId),
    input: {
      settings,
      limits: ZMK_LIMITS,
      scope: getGenerationScope(project, settings, selection),
    },
    gridStepU: context.gridStepU,
  };
}
