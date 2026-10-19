import type { Encoder } from '@domain';
import { replaceEncoder } from '@domain/encoders';
import { ENCODER_OPTIONS } from '@catalog/encoders';
import { getControllerBoard } from '@catalog/controllers';
import { useProject } from '@ui/project/logic';
import { Field, DocsLink } from '@ui/components/components';
import type { FieldControlProps } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

type EncoderPinProps = {
  readonly encoder: Encoder;
  readonly index: number;
  readonly property: 'aPin' | 'bPin';
};
export function EncoderPin(props: EncoderPinProps) {
  const { index, property } = props;
  const { issues } = useProject();
  const error = issues
    .filter((issue) => issue.path.join('.') === `encoders.${index}.${property}`)
    .map((issue) => issue.message)
    .join(' ');
  return (
    <Field
      label={`Encoder ${index} ${property === 'aPin' ? 'A' : 'B'} pin`}
      error={error || undefined}
      description={
        <>
          {ENCODER_OPTIONS.pins.description}{' '}
          <DocsLink href={ENCODER_OPTIONS.pins.docsUrl} topic={ENCODER_OPTIONS.pins.label} />
        </>
      }
      renderControl={(control) => <EncoderPinControl {...props} control={control} />}
    />
  );
}
function EncoderPinControl({
  encoder,
  index,
  property,
  control,
}: EncoderPinProps & { readonly control: FieldControlProps }) {
  const { project, commit } = useProject();
  const board = getControllerBoard(project.controllerId);
  const pin = encoder[property];
  function handleChange(event: { readonly target: { readonly value: string } }) {
    const { [property]: _removed, ...rest } = encoder;
    const next =
      event.target.value === '' ? rest : { ...rest, [property]: Number(event.target.value) };
    commit((current) => replaceEncoder(current, next));
  }
  return (
    <select
      {...control}
      className={INPUT_CLASSES}
      data-issue-path={`encoders.${index}.${property}`}
      value={pin ?? ''}
      onChange={handleChange}
    >
      <option value="">Unassigned</option>
      {pin !== undefined && !board.gpioPins.includes(pin) ? (
        <option value={pin}>{`Unavailable D${pin}`}</option>
      ) : undefined}
      {board.pins
        .filter((entry) => board.gpioPins.includes(entry.index))
        .map((entry) => (
          <option key={entry.index} value={entry.index}>
            {entry.label}
          </option>
        ))}
    </select>
  );
}
