import { EmptyState } from '../components/empty-state';
import { PlaceholderFooter } from '../shell/placeholder-footer';

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
