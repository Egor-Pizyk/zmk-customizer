import { useEffect, useState } from 'react';
import { REVEAL_ISSUE_EVENT } from '@ui/issues';
import { Button, Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import { PlaceholderFooter } from '@ui/shell/components';
import { FirmwareOptionGroups } from './firmware-option-groups';

export function FirmwareWorkspace() {
  const [search, setSearch] = useState('');
  useEffect(() => {
    function reveal() {
      setSearch('');
    }
    document.addEventListener(REVEAL_ISSUE_EVENT, reveal);
    return () => {
      document.removeEventListener(REVEAL_ISSUE_EVENT, reveal);
    };
  }, []);
  return (
    <>
      <div className="flex flex-col gap-6 p-4">
        <p>
          Build settings for ZMK v0.3.0. USB and Bluetooth support come from the controller board.
          Reset returns to the applicable default. Rebuild and reflash after changes.
        </p>
        <FirmwareSearch
          search={search}
          onChange={(value) => {
            setSearch(value);
          }}
        />
        <FirmwareOptionGroups search={search} />
      </div>
      <PlaceholderFooter />
    </>
  );
}

function FirmwareSearch({
  search,
  onChange: handleChange,
}: {
  readonly search: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Field
          label="Search firmware settings"
          renderControl={(controlProps) => (
            <input
              {...controlProps}
              className={INPUT_CLASSES}
              onChange={(event) => {
                handleChange(event.target.value);
              }}
              type="search"
              value={search}
            />
          )}
        />
      </div>
      <Button
        onClick={() => {
          handleChange('');
        }}
        variant="secondary"
      >
        Clear search
      </Button>
    </div>
  );
}
