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
  function handleOperation(kind: 'regenerate' | 'prettify') {
    handleEdit(createRoutingEdit({ project, settings, selection, gridStepU: gridSizeU }, kind));
  }

  const isScopedDirect = project.wiring?.kind === 'direct' && settings.preferredScope !== 'all';
  return (
    <fieldset aria-label="Wiring actions" className="flex flex-wrap gap-2">
      <Button
        variant={hasPreview ? 'secondary' : 'primary'}
        isDisabled={isScopedDirect}
        hint={
          isScopedDirect
            ? 'Direct generation requires Whole schematic scope. Prettify supports the selected scope.'
            : undefined
        }
        onClick={() => {
          handleOperation('regenerate');
        }}
      >
        Generate wiring
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          handleOperation('prettify');
        }}
      >
        Prettify
      </Button>
    </fieldset>
  );
}

function createRoutingEdit(
  context: Pick<Props, 'project' | 'settings' | 'selection'> & { readonly gridStepU: number },
  kind: 'regenerate' | 'prettify',
): WiringEdit {
  const { project, settings, selection } = context;
  return {
    kind,
    board: getControllerBoard(project.controllerId),
    input: {
      settings,
      limits: ZMK_LIMITS,
      scope: getGenerationScope(project, settings, selection),
    },
    ...(kind === 'regenerate' ? { gridStepU: context.gridStepU } : {}),
  };
}
