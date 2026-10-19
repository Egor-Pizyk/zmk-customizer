import { setBehaviorTap } from '@domain/behaviors';
import type { BehaviorEditorProps } from '@ui/bindings/behaviors/logic';
import { Button } from '@ui/components/components';
import { BehaviorAction } from './behavior-action';

export function TapActionRow({
  behavior,
  project,
  onChange: handleChange,
  actionId,
  index,
}: BehaviorEditorProps & { readonly actionId: string; readonly index: number }) {
  if (behavior.kind !== 'tap-dance') {
    return null;
  }
  const action = behavior.bindings.find((entry) => entry.id === actionId);
  if (action === undefined) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <BehaviorAction
        binding={action.binding}
        label={`Tap ${index + 1}`}
        project={project}
        onChange={(binding) => {
          handleChange(setBehaviorTap(behavior, { actionId, binding }));
        }}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          handleChange({
            ...behavior,
            bindings: behavior.bindings.filter((entry) => entry.id !== actionId),
          });
        }}
      >{`Remove tap ${index + 1}`}</Button>
    </div>
  );
}
