import type { ActionEditorProps } from '@ui/bindings/behaviors/logic';
import { StrokeChoice } from './stroke-choice';

export function StrokeActionParameters({
  label,
  binding,
  onChange: handleChange,
}: ActionEditorProps) {
  return (
    <>
      {'key' in binding ? (
        <StrokeChoice
          label={`${label} key`}
          stroke={binding.key}
          onChange={(key) => {
            handleChange({ ...binding, key });
          }}
        />
      ) : undefined}
      {binding.kind === 'mt' ? (
        <StrokeChoice
          label={`${label} hold key`}
          stroke={binding.hold}
          onChange={(hold) => {
            handleChange({ ...binding, hold });
          }}
        />
      ) : undefined}
      {binding.kind === 'mt' || binding.kind === 'lt' ? (
        <StrokeChoice
          label={`${label} tap key`}
          stroke={binding.tap}
          onChange={(tap) => {
            handleChange({ ...binding, tap });
          }}
        />
      ) : undefined}
    </>
  );
}
