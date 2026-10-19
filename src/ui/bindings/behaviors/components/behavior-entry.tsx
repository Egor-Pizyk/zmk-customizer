import { getBehaviorLabel, removeBehavior, replaceBehavior } from '@domain/behaviors';
import type { CustomBehavior } from '@domain';
import { Button } from '@ui/components/components';
import { useProject } from '@ui/project/logic';
import { BehaviorName } from './behavior-name';
import { BehaviorOptions } from './behavior-options';

export function BehaviorEntry({
  behavior,
  index,
}: {
  readonly behavior: CustomBehavior;
  readonly index: number;
}) {
  const { project, commit, issues } = useProject();
  const errors = issues.filter((issue) => issue.path[0] === 'behaviors' && issue.path[1] === index);
  return (
    <details className="rounded-md border border-border p-2">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">
        {behavior.name || behavior.id}
      </summary>
      <div className="flex flex-col gap-4 p-2">
        <BehaviorName
          behavior={behavior}
          index={index}
          errors={errors}
          onCommit={(name) => {
            commit((current) => replaceBehavior(current, { ...behavior, name }));
          }}
        />
        <p className="font-mono text-xs">{`&${getBehaviorLabel(behavior)}`}</p>
        <BehaviorOptions
          behavior={behavior}
          project={project}
          onChange={(value) => {
            commit((current) => replaceBehavior(current, value));
          }}
        />
        <BehaviorDelete behavior={behavior} />
      </div>
    </details>
  );
}

function BehaviorDelete({ behavior }: { readonly behavior: CustomBehavior }) {
  const { commit } = useProject();
  return (
    <Button
      variant="danger"
      onClick={() => {
        commit(
          (current) => removeBehavior(current, behavior.id),
          `Deleted behavior ${behavior.name}. Undo to restore it.`,
        );
      }}
    >{`Delete behavior ${behavior.name}`}</Button>
  );
}
