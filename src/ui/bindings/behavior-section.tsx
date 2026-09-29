import { BEHAVIORS } from '../../catalog/behaviors';
import type { SharedBinding } from '../../domain/get-shared-binding';

type BehaviorSectionProps = {
  readonly shared: SharedBinding;
};

function behaviorName(shared: SharedBinding): string {
  if (shared.kind !== 'same') {
    return 'Different actions';
  }
  const binding = shared.binding;
  if (binding.kind === 'kp') {
    return 'Key press';
  }
  return BEHAVIORS.find((behavior) => behavior.id === binding.kind)?.label ?? binding.kind;
}

// The behavior of the selected keys, shown quietly until more behaviors land with editors.
export function BehaviorSection({ shared }: BehaviorSectionProps) {
  return (
    <>
      <p className="text-sm">
        <span className="text-text-muted">Behavior: </span>
        {behaviorName(shared)}
      </p>
      <p className="text-xs text-text-muted">More behaviors coming soon.</p>
    </>
  );
}
