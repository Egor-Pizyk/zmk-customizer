import { useState } from 'react';
import type { ReactNode } from 'react';
import { WiringRoutingActions } from './wiring-routing-actions';
import { getRoutingSettings } from '@domain/wiring';
import type { Project, RoutingSettings } from '@domain';
import type { WiringEdit } from '@domain/wiring/editing';
import type { SchematicSelection } from '@ui/schematic/interaction';
import { Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

type Props = {
  readonly configuration: ReactNode;
  readonly children?: ReactNode;
  readonly project: Project;
  readonly hasPreview: boolean;
  readonly selection?: SchematicSelection;
  readonly onEdit: (input: WiringEdit) => void;
};
type SettingsProps = {
  readonly settings: RoutingSettings;
  readonly onSettings: (patch: Partial<RoutingSettings>) => void;
};

export function WiringRoutingControls({
  project,
  configuration,
  children,
  selection,
  hasPreview,
  onEdit: handleEdit,
}: Props) {
  const [draft, setDraft] = useState<RoutingSettings>();
  const settings = draft ?? getRoutingSettings(project);
  const handleSettings = (patch: Partial<RoutingSettings>) => {
    setDraft({ ...settings, ...patch });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="px-4">
        <WiringRoutingActions
          project={project}
          selection={selection}
          settings={settings}
          hasPreview={hasPreview}
          onEdit={handleEdit}
        />
      </div>
      <div className="flex max-h-96 flex-col gap-4 overflow-auto px-4 pb-4">
        <p className="text-text-muted">
          Generate replaces wiring in the selected scope and preserves locked objects. Check GPIOs
          against your hardware before Apply.
        </p>
        {configuration}
        <RoutingSelectors settings={settings} onSettings={handleSettings} />
        {children}
      </div>
    </div>
  );
}

function RoutingSelectors({ settings, onSettings: handleSettings }: SettingsProps) {
  return (
    <div className="flex flex-wrap gap-3">
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
