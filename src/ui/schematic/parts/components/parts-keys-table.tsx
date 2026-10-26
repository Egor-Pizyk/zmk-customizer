import type { WiresOfPin } from '@ui/schematic/formatting';
import type { PartsTableProps } from './parts-list';
import { PartsTableHead } from './parts-table-head';
import { PartsKeysTableRows } from './parts-keys-table-rows';
import { AddKeyButton } from '@ui/schematic/layout/components';
import { useState } from 'react';

const COLUMNS = [
  'Select',
  'Key',
  'X (u)',
  'Y (u)',
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
    <details open>
      <summary className="cursor-pointer py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <h3 className="inline font-semibold">Keys</h3>
      </summary>
      <div className="flex flex-col gap-2">
        {project.keys.length === 0 ? (
          <p className="text-text-muted">
            No keys yet. Pick the Key tool and click the canvas, or add one here.
          </p>
        ) : (
          <div className="overflow-auto">
            <table data-parts-keys className="w-full min-w-240 text-left">
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
          </div>
        )}
        <AddKeyButton project={project} commit={commit} />
      </div>
    </details>
  );
}
