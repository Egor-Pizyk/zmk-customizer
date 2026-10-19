import { useProject } from '@ui/project/logic';
import { BehaviorCreateForm } from './behavior-create-form';
import { BehaviorEntry } from './behavior-entry';

export function BehaviorLibrary({ reservedIds }: { readonly reservedIds: readonly string[] }) {
  const { project } = useProject();
  return (
    <details className="shrink-0 border-b border-border bg-surface-raised p-2">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">
        Custom behaviors
      </summary>
      <div className="flex max-h-96 flex-col gap-4 overflow-auto p-2">
        <BehaviorCreateForm reservedIds={reservedIds} />
        {project.behaviors.length === 0 ? (
          <p>No custom behaviors yet. Create one, then assign it from the Action picker.</p>
        ) : undefined}
        {project.behaviors.map((behavior, index) => (
          <BehaviorEntry key={behavior.id} behavior={behavior} index={index} />
        ))}
      </div>
    </details>
  );
}
