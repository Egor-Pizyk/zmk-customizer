import { WIRING_OPTIONS, getControllerBoard } from '@catalog/controllers';
import type { WiringEdit, Project } from '@domain';
import { usePreferences } from '@ui/preferences';
import { Button, DocsLink, Field, INPUT_CLASSES } from '@ui/components';

export function WiringOptionsControls({ project, onEdit: handleEdit }: WiringOptionsControlsInput) {
  const wiring = project.wiring;
  const board = getControllerBoard(project.controllerId);
  if (wiring === undefined) {
    return null;
  }
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <WiringOption
          label="Scanning type"
          options={WIRING_OPTIONS.modes}
          value={wiring.kind}
          onSelect={(value) => {
            handleEdit({ kind: 'mode', mode: value === 'direct' ? 'direct' : 'matrix', board });
          }}
        />
        <WiringOption
          label="Keyboard topology"
          options={WIRING_OPTIONS.topologies}
          value={wiring.topology}
          onSelect={(value) => {
            handleEdit(getTopologyEdit(value, board));
          }}
        />
        {wiring.kind === 'matrix' ? (
          <WiringOption
            label="Diode direction"
            options={WIRING_OPTIONS.directions}
            value={wiring.diodeDirection}
            onSelect={(value) => {
              handleEdit(getDirectionEdit(value, board));
            }}
          />
        ) : undefined}
      </div>
      <WiringOptionLinks project={project} onEdit={handleEdit} />
    </>
  );
}

function WiringOption({
  label,
  options,
  value,
  onSelect,
}: {
  readonly label: string;
  readonly options: readonly { id: string; label: string; description: string }[];
  readonly value: string;
  readonly onSelect: (value: string) => void;
}) {
  return (
    <Field
      label={label}
      description={options.find((option) => option.id === value)?.description}
      renderControl={(control) => (
        <select
          {...control}
          className={INPUT_CLASSES}
          value={value}
          onChange={(event) => {
            onSelect(event.target.value);
          }}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    />
  );
}

type WiringOptionsControlsInput = {
  readonly project: Project;
  readonly onEdit: (input: WiringEdit) => void;
};

function WiringOptionLinks({ project, onEdit: handleEdit }: WiringOptionsControlsInput) {
  const wiring = project.wiring;
  const board = getControllerBoard(project.controllerId);
  const { gridSizeU } = usePreferences().preferences;
  if (wiring === undefined) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <DocsLink
        href={
          WIRING_OPTIONS.modes.find((option) => option.id === wiring.kind)?.docsUrl ??
          WIRING_OPTIONS.modes[0].docsUrl
        }
        topic="Scanning type"
      />
      <DocsLink
        href={
          WIRING_OPTIONS.topologies.find((option) => option.id === wiring.topology)?.docsUrl ??
          WIRING_OPTIONS.topologies[0].docsUrl
        }
        topic="Keyboard topology"
      />
      {wiring.kind === 'matrix' ? (
        <DocsLink href={WIRING_OPTIONS.directions[0].docsUrl} topic="Diode direction" />
      ) : undefined}
      <Button
        variant="secondary"
        onClick={() => {
          handleEdit({ kind: 'auto', gridStepU: gridSizeU, board });
        }}
      >
        Auto assign cells
      </Button>
    </div>
  );
}

function getTopologyEdit(value: string, board: WiringEdit['board']): WiringEdit {
  return { kind: 'topology', topology: value === 'split' ? 'split' : 'unibody', board };
}
function getDirectionEdit(value: string, board: WiringEdit['board']): WiringEdit {
  return { kind: 'direction', direction: value === 'row2col' ? 'row2col' : 'col2row', board };
}
