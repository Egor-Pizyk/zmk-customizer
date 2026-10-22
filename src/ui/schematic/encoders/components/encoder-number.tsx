import type { Encoder } from '@domain';
import { getEncoderGeometry } from '@domain/geometry';
import { replaceEncoder } from '@domain/encoders';
import { ZMK_LIMITS } from '@catalog/firmware';
import { ENCODER_OPTIONS } from '@catalog/encoders';
import { useProject } from '@ui/project/logic';
import { Field, DocsLink, NumberInput } from '@ui/components/components';
import type { FieldControlProps } from '@ui/components/components';

type EncoderNumberProps = {
  readonly encoder: Encoder;
  readonly index: number;
  readonly property: 'xU' | 'yU' | 'rotationDeg' | 'steps' | 'triggersPerRotation';
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
  const name =
    option?.label ??
    (property === 'rotationDeg' ? 'Rotation (°)' : `${property === 'xU' ? 'X' : 'Y'} (u)`);
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
  const { project, commit } = useProject();
  const geometry = getEncoderGeometry(project, encoder);
  const currentValue =
    property === 'xU' || property === 'yU' || property === 'rotationDeg'
      ? geometry[property]
      : encoder[property];
  const option = findOption(property);
  return (
    <NumberInput
      label={label}
      id={control.id}
      describedBy={control['aria-describedby']}
      value={currentValue}
      step={property === 'rotationDeg' || option !== undefined ? 1 : 0.25}
      min={property === 'rotationDeg' ? -360 : (option?.min ?? ZMK_LIMITS.minLayoutCell / 100)}
      max={property === 'rotationDeg' ? 360 : (option?.max ?? ZMK_LIMITS.maxLayoutCell / 100)}
      issuePath={`encoders.${index}.${property}`}
      isInvalid={control['aria-invalid'] === true}
      onCommit={(value) => {
        commit((current) => replaceEncoder(current, { ...encoder, [property]: value }));
      }}
    />
  );
}
