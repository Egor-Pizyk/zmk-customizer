import { EmptyState } from '../components/empty-state';
import { PlaceholderFooter } from '../shell/placeholder-footer';

export function ExportWorkspace() {
  return (
    <>
      <EmptyState
        description="Generated ZMK files and the download will appear here."
        title="Export"
      />
      <PlaceholderFooter />
    </>
  );
}
