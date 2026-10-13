import { useState } from 'react';
import type { WiresOfPin } from './format-schematic-labels';
import type { PartsTableProps } from './parts-list';
import { PartsTableHead } from './parts-table-head';
import { PartsKeysTableRows } from './parts-keys-table-rows';
import { AddKeyButton } from './add-key-button';

const COLUMNS = [
  'Select',
  'Key',
  'X (u)',
  'Y (u)',
  'Width (u)',
  'Height (u)',
  'Rotation (°)',
  'Origin X (u)',
  'Origin Y (u)',
  'Pin 1',
  'Pin 2',
];

export function PartsKeysTable(props: PartsTableProps & { readonly wiresOf: WiresOfPin }) {
  const { project, commit, wiresOf } = props;
  const [activeKeyId, setActiveKeyId] = useState<string | undefined>();

  function handleActiveKeyChange(keyId: string) {
    setActiveKeyId(keyId);
  }
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">Keys</h3>
      {project.keys.length === 0 ? (
        <p className="text-text-muted">
          No keys yet. Pick the Key tool and click the canvas, or add one here.
        </p>
      ) : (
        <table className="w-full text-left">
          <PartsTableHead columns={COLUMNS} hasActions />
          <tbody>
            <PartsKeysTableRows
              {...props}
              activeKeyId={activeKeyId}
              onActiveKeyChange={handleActiveKeyChange}
              wiresOf={wiresOf}
            />
          </tbody>
        </table>
      )}
      <AddKeyButton project={project} commit={commit} />
    </div>
  );
}
