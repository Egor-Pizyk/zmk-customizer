import { useState } from 'react';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { getRoutingSettings } from '@domain/wiring';
import type { Project, RoutingSettings } from '@domain';
import type { WiringEdit } from '@domain/wiring/editing';
import type { SchematicSelection } from '@ui/schematic/interaction';
import { getGenerationScope } from '@ui/schematic/wiring/logic';
import { Button, Field, NumberInput } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

type Props = {
  readonly project: Project;
  readonly selection?: SchematicSelection;
  readonly onEdit: (input: WiringEdit) => void;
};
type SettingsProps = {
  readonly settings: RoutingSettings;
  readonly onSettings: (patch: Partial<RoutingSettings>) => void;
};

export function WiringRoutingControls({ project, selection, onEdit: handleEdit }: Props) {
  const [draft, setDraft] = useState<RoutingSettings>();
  const settings = draft ?? getRoutingSettings(project);
  const handleSettings = (patch: Partial<RoutingSettings>) => {
    setDraft({ ...settings, ...patch });
  };
  return (
    <fieldset className="flex flex-col gap-3 rounded-sm border border-border p-3">
      <legend className="px-1 font-semibold">Routing</legend>
      <p className="text-xs text-text-muted">
        Generate proposes connections; Prettify only reshapes saved wiring and replaces any
        unapplied generation preview. Apply saves the reviewed result.
      </p>
      <RoutingSelectors
        settings={settings}
        onSettings={handleSettings}
        isMatrix={project.wiring?.kind !== 'direct'}
      />
      <RoutingDistances settings={settings} onSettings={handleSettings} />
      <p className="text-xs text-text-muted">
        Selected wires mean their complete electrical nets. Shared and locked conductors remain
        fixed; incompatible boundaries refuse the entire operation.
      </p>
      <RoutingActions
        project={project}
        selection={selection}
        settings={settings}
        onEdit={handleEdit}
      />
    </fieldset>
  );
}

function RoutingSelectors({
  settings,
  onSettings: handleSettings,
  isMatrix,
}: SettingsProps & { readonly isMatrix: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      {isMatrix ? <MatrixStyle settings={settings} onSettings={handleSettings} /> : undefined}
      <RoutingSelect
        label="Routing scope"
        value={
          settings.preferredScope === 'half'
            ? (settings.preferredHalf ?? 'left')
            : settings.preferredScope
        }
        options={[
          { id: 'all', label: 'Whole schematic' },
          { id: 'left', label: 'Left half' },
          { id: 'right', label: 'Right half' },
          { id: 'selection', label: 'Selected keys and nets' },
        ]}
        onSelect={(value) => {
          handleSettings(scopeSettings(value));
        }}
      />
    </div>
  );
}

function RoutingDistances({ settings, onSettings: handleSettings }: SettingsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {[
        { field: 'offsetU', label: 'Routing offset (u)' },
        { field: 'clearanceU', label: 'Parallel clearance (u)' },
        { field: 'fallbackRowIntervalU', label: 'Single-row interval (u)' },
      ].map(({ field, label }) => (
        <RoutingDistance
          key={field}
          label={label}
          value={distanceValue(settings, field)}
          onCommit={(value) => {
            handleSettings(distancePatch(field, value));
          }}
        />
      ))}
    </div>
  );
}

function RoutingDistance({
  label,
  value,
  onCommit: handleCommit,
}: {
  readonly label: string;
  readonly value: number;
  readonly onCommit: (value: number) => void;
}) {
  return (
    <Field
      label={label}
      renderControl={(control) => (
        <NumberInput
          id={control.id}
          label={label}
          value={value}
          min={0.0001}
          step={0.05}
          onCommit={handleCommit}
        />
      )}
    />
  );
}

function RoutingSelect({
  label,
  value,
  options,
  onSelect,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly id: string; readonly label: string }[];
  readonly onSelect: (value: string) => void;
}) {
  return (
    <Field
      label={label}
      renderControl={(control) => (
        <select
          {...control}
          value={value}
          className={INPUT_CLASSES}
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

function scopeSettings(value: string): Partial<RoutingSettings> {
  if (value === 'left' || value === 'right') {
    return { preferredScope: 'half', preferredHalf: value };
  }
  return { preferredScope: value === 'selection' ? 'selection' : 'all' };
}
function distanceValue(settings: RoutingSettings, field: string): number {
  if (field === 'offsetU') {
    return settings.offsetU;
  }
  return field === 'clearanceU' ? settings.clearanceU : settings.fallbackRowIntervalU;
}
function distancePatch(field: string, value: number): Partial<RoutingSettings> {
  if (field === 'offsetU') {
    return { offsetU: value };
  }
  return field === 'clearanceU' ? { clearanceU: value } : { fallbackRowIntervalU: value };
}

function RoutingActions({
  project,
  selection,
  settings,
  onEdit: handleEdit,
}: Props & Pick<SettingsProps, 'settings'>) {
  function handleOperation(kind: 'regenerate' | 'prettify') {
    const input = {
      settings,
      limits: ZMK_LIMITS,
      scope: getGenerationScope(project, settings, selection),
    };
    const board = getControllerBoard(project.controllerId);
    handleEdit({ kind, input, board });
  }
  return (
    <div className="flex flex-wrap gap-2">
      {project.wiring?.kind === 'direct' ? undefined : (
        <Button
          variant="secondary"
          onClick={() => {
            handleOperation('regenerate');
          }}
        >
          Generate wiring
        </Button>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          handleOperation('prettify');
        }}
      >
        Prettify
      </Button>
    </div>
  );
}

function MatrixStyle({ settings, onSettings: handleSettings }: SettingsProps) {
  return (
    <RoutingSelect
      label="Routing style"
      value={settings.matrixStyle}
      options={[
        { id: 'existing', label: 'Existing matrix routes' },
        { id: 'symmetric-bus', label: 'Symmetric matrix buses' },
      ]}
      onSelect={(value) => {
        handleSettings({ matrixStyle: value === 'symmetric-bus' ? 'symmetric-bus' : 'existing' });
      }}
    />
  );
}
