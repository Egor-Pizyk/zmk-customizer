import type { Encoder } from '@domain';
import { removeEncoder, replaceEncoder, setEncoderPushSwitch } from '@domain/encoders';
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
      <EncoderNumber encoder={encoder} index={index} property="rotationDeg" />
      <EncoderOptions encoder={encoder} index={index} />
      <EncoderHalf encoder={encoder} index={index} />
      {encoder.wiringMode === 'schematic' ? (
        <p className="max-w-64 text-sm text-text-muted">
          Wire A/B to distinct GPIOs and COM to ground using the canvas or wire list.
        </p>
      ) : (
        <>
          <EncoderPin encoder={encoder} index={index} property="aPin" />
          <EncoderPin encoder={encoder} index={index} property="bPin" />
        </>
      )}
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

function EncoderOptions({ encoder, index }: Pick<EncoderHardwareProps, 'encoder' | 'index'>) {
  const { commit } = useProject();
  return (
    <div className="flex flex-col gap-2">
      <EncoderWiring encoder={encoder} index={index} />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          checked={encoder.pushKeyId !== undefined}
          onChange={(event) => {
            const enabled = event.target.checked;
            commit((current) => setEncoderPushSwitch(current, { encoderId: encoder.id, enabled }));
          }}
        />
        {`Encoder ${index} push switch`}
      </label>
      {encoder.pushKeyId === undefined ? null : (
        <p className="max-w-64 text-sm text-text-muted">
          SW1/SW2 are the separate push-button contacts. Wire them like an ordinary key; only this
          switch may need a matrix diode. A/COM/B never use a key diode.
        </p>
      )}
    </div>
  );
}

function EncoderWiring({ encoder, index }: Pick<EncoderHardwareProps, 'encoder' | 'index'>) {
  const { issues, commit } = useProject();
  const fields =
    encoder.wiringMode === 'schematic' ? ['wiringMode', 'aPin', 'bPin'] : ['wiringMode'];
  const paths = fields.map((field) => `encoders.${index}.${field}`);
  const error = issues
    .filter((issue) => paths.includes(issue.path.join('.')))
    .map((issue) => issue.message)
    .join(' ');
  return (
    <Field
      label={`Encoder ${index} schematic wiring`}
      error={error || undefined}
      description="Schematic mode uses A/B wires to GPIOs and COM to ground. Disconnect rotary wires before disabling to edit legacy direct pin assignments."
      renderControl={(control) => (
        <input
          {...control}
          type="checkbox"
          data-issue-path={paths.join(' ')}
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          checked={encoder.wiringMode === 'schematic'}
          onChange={(event) => {
            const { wiringMode: _removed, ...legacy } = encoder;
            const next = event.target.checked
              ? { ...encoder, wiringMode: 'schematic' as const }
              : legacy;
            commit((current) => replaceEncoder(current, next));
          }}
        />
      )}
    />
  );
}
