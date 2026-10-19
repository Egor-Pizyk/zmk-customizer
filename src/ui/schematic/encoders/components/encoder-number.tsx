import type { Encoder } from '@domain';
import { replaceEncoder } from '@domain/encoders';
import { ZMK_LIMITS } from '@catalog/firmware';
import { ENCODER_OPTIONS } from '@catalog/encoders';
import { useProject } from '@ui/project/logic';
import { Field, DocsLink, NumberInput } from '@ui/components/components';
import type { FieldControlProps } from '@ui/components/components';

type EncoderNumberProps = {
  readonly encoder: Encoder;
  readonly index: number;
  readonly property: 'xU' | 'yU' | 'steps' | 'triggersPerRotation';
};
function findOption(property: EncoderNumberProps['property']) {
  return property === 'steps' || property === 'triggersPerRotation'
    ? ENCODER_OPTIONS[property]
    : undefined;
}
export function EncoderNumber(props: EncoderNumberProps) {
  const { index, property } = props;
  const { issues } = useProject();
  const option = findOption(property);
  const name = option?.label ?? `${property === 'xU' ? 'X' : 'Y'} (u)`;
  const label = `Encoder ${index} ${name}`;
  const error = issues.find(
    (issue) => issue.path.join('.') === `encoders.${index}.${property}`,
  )?.message;
  return (
    <Field
      label={label}
      error={error}
      description={
        option === undefined ? undefined : (
          <>
            {option.description} Default: {option.defaultValue}.{' '}
            <DocsLink href={option.docsUrl} topic={option.label} />
          </>
        )
      }
      renderControl={(control) => (
        <EncoderNumberControl {...props} label={label} control={control} />
      )}
    />
  );
}
function EncoderNumberControl({
  encoder,
  index,
  property,
  label,
  control,
}: EncoderNumberProps & { readonly label: string; readonly control: FieldControlProps }) {
  const { commit } = useProject();
  const option = findOption(property);
  return (
    <NumberInput
      label={label}
      id={control.id}
      describedBy={control['aria-describedby']}
      value={encoder[property]}
      step={option === undefined ? 0.25 : 1}
      min={option?.min ?? ZMK_LIMITS.minLayoutCell / 100}
      max={option?.max ?? ZMK_LIMITS.maxLayoutCell / 100}
      issuePath={`encoders.${index}.${property}`}
      isInvalid={control['aria-invalid'] === true}
      onCommit={(value) => {
        commit((current) => replaceEncoder(current, { ...encoder, [property]: value }));
      }}
    />
  );
}
