import { Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import { useFieldDraft } from '@ui/bindings/behaviors/logic';
import { useProject } from '@ui/project/logic';

export function AdvancedName({
  label,
  value,
  collection,
  index,
  onCommit,
}: {
  readonly label: string;
  readonly value: string;
  readonly collection: string;
  readonly index: number;
  readonly onCommit: (value: string) => void;
}) {
  const { issues } = useProject();
  const errors = issues.filter((issue) => issue.path[0] === collection && issue.path[1] === index);
  const path = `${collection}.${index}`;
  const paths = [path, ...errors.map((issue) => issue.path.join('.'))].join(' ');
  const draft = useFieldDraft(value, onCommit);
  return (
    <Field
      label={label}
      error={errors.length === 0 ? undefined : errors.map((issue) => issue.message).join(' ')}
      renderControl={(props) => (
        <input
          {...props}
          {...draft}
          className={INPUT_CLASSES}
          maxLength={160}
          data-issue-path={paths}
        />
      )}
    />
  );
}
