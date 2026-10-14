import { EmptyState } from '@ui/components/components';
import { PlaceholderFooter } from '@ui/shell/components';

export function FirmwareWorkspace() {
  return (
    <>
      <EmptyState
        description="ZMK settings for your keyboard will appear here."
        title="Firmware settings"
      />
      <PlaceholderFooter />
    </>
  );
}
