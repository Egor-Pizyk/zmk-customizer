import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { usePreferences } from '../preferences-context';

// Bindings without keys: point to where keys are drawn (spec 004 FR-004).
export function NoKeys() {
  const { changePreferences } = usePreferences();

  function handleGoToSchematicClick() {
    changePreferences({ activeWorkspaceId: 'schematic' });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2">
      <EmptyState
        description="Draw keys in Schematic; they appear here as keycaps."
        title="No keys yet"
      />
      <Button onClick={handleGoToSchematicClick} variant="primary">
        Go to Schematic
      </Button>
    </div>
  );
}
