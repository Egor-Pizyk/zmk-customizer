import type { Encoder } from '@domain';
import { removeEncoder, replaceEncoder } from '@domain/encoders';
import { useProject } from '@ui/project/logic';
import { Button, Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import { EncoderNumber } from './encoder-number';
import { EncoderPin } from './encoder-pin';

type EncoderHardwareProps = {
  readonly encoder: Encoder;
  readonly index: number;
  readonly onDelete: () => void;
};
export function EncoderHardware({ encoder, index, onDelete: handleDelete }: EncoderHardwareProps) {
  const { commit } = useProject();
  return (
    <fieldset className="flex flex-wrap items-start gap-3 rounded-md border border-border p-2">
      <legend>{`Encoder ${index}`}</legend>
      <EncoderNumber encoder={encoder} index={index} property="xU" />
      <EncoderNumber encoder={encoder} index={index} property="yU" />
      <EncoderHalf encoder={encoder} index={index} />
      <EncoderPin encoder={encoder} index={index} property="aPin" />
      <EncoderPin encoder={encoder} index={index} property="bPin" />
      <EncoderNumber encoder={encoder} index={index} property="steps" />
      <EncoderNumber encoder={encoder} index={index} property="triggersPerRotation" />
      <Button
        variant="danger"
        onClick={() => {
          commit(
            (current) => removeEncoder(current, encoder.id),
            `Deleted encoder ${index}. Undo to restore it.`,
          );
          handleDelete();
        }}
      >{`Delete encoder ${index}`}</Button>
    </fieldset>
  );
}

function EncoderHalf({ encoder, index }: Pick<EncoderHardwareProps, 'encoder' | 'index'>) {
  const { issues, commit } = useProject();
  const path = `encoders.${index}.half`;
  return (
    <Field
      label={`Encoder ${index} half`}
      error={issues.find((issue) => issue.path.join('.') === path)?.message}
      renderControl={(props) => (
        <select
          {...props}
          className={INPUT_CLASSES}
          data-issue-path={path}
          value={encoder.half}
          onChange={(event) => {
            const half = event.target.value === 'right' ? 'right' : 'left';
            commit((current) => replaceEncoder(current, { ...encoder, half }));
          }}
        >
          <option value="left">Left / unibody</option>
          <option value="right">Right</option>
        </select>
      )}
    />
  );
}
