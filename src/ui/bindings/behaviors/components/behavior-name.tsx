import { CUSTOM_BEHAVIOR_TYPES } from '@catalog/bindings';
import type { CustomBehavior, ValidationIssue } from '@domain';
import { DocsLink, Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import { useFieldDraft } from '@ui/bindings/behaviors/logic';

export function BehaviorName({
  behavior,
  index,
  errors,
  onCommit,
}: {
  readonly behavior: CustomBehavior;
  readonly index: number;
  readonly errors: readonly ValidationIssue[];
  readonly onCommit: (name: string) => void;
}) {
  const draft = useFieldDraft(behavior.name, onCommit);
  const entry = CUSTOM_BEHAVIOR_TYPES.find((value) => value.kind === behavior.kind);
  const paths = [`behaviors.${index}`, ...errors.map((issue) => issue.path.join('.'))].join(' ');
  return (
    <Field
      label="Behavior name"
      error={errors.length === 0 ? undefined : errors.map((issue) => issue.message).join(' ')}
      description={
        entry === undefined ? undefined : (
          <>
            {entry.description} <DocsLink href={entry.docsUrl} topic={entry.label} />
          </>
        )
      }
      renderControl={(props) => (
        <input
          {...props}
          {...draft}
          className={INPUT_CLASSES}
          data-issue-path={paths}
          maxLength={160}
        />
      )}
    />
  );
}
