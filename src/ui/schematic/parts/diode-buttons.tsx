import { getKeyDiodeState, getKeyPinPosition, toggleKeyDiode } from '@domain';
import type { Key, KeyPin, Project } from '@domain';
import type { ContentView } from '@ui/canvas';
import { toScreenPoint } from '@ui/canvas';

const PINS: readonly KeyPin[] = [1, 2];

type DiodeButtonsProps = {
  readonly project: Project;
  readonly view: ContentView;
  readonly commit: (change: (project: Project) => Project) => void;
};

export function DiodeButtons({ project, view, commit }: DiodeButtonsProps) {
  if (view.zoom < 0.5) {
    return null;
  }
  return project.keys.map((key, keyIndex) =>
    PINS.map((pin) => (
      <DiodeButton
        commit={commit}
        key={`${key.id}:${pin}`}
        keyIndex={keyIndex}
        pin={pin}
        schematicKey={key}
        view={view}
      />
    )),
  );
}

function DiodeButton({
  schematicKey,
  keyIndex,
  pin,
  view,
  commit,
}: Omit<DiodeButtonsProps, 'project'> & {
  readonly schematicKey: Key;
  readonly keyIndex: number;
  readonly pin: KeyPin;
}) {
  const state = getKeyDiodeState(schematicKey, pin);
  const { xPx, yPx } = toScreenPoint(view, getKeyPinPosition(schematicKey, pin));
  const label = `${state.isPresent ? 'Remove' : 'Add'} diode at key ${keyIndex} pin ${pin}`;
  const hint = state.isDisabled ? 'Remove the diode at the other pin first' : label;
  function handleClick() {
    if (!state.isDisabled) {
      commit((current) => toggleKeyDiode(current, { keyId: schematicKey.id, pin }));
    }
  }
  return (
    <foreignObject height={24} width={24} x={xPx - 12} y={yPx + (pin === 1 ? 14 : -38)}>
      <button
        aria-disabled={state.isDisabled || undefined}
        aria-label={label}
        aria-pressed={state.isPresent}
        className="flex size-full items-center justify-center rounded-full bg-surface-raised/90 text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-pressed:text-accent"
        onClick={handleClick}
        tabIndex={-1}
        title={hint}
        type="button"
      >
        <DiodeIcon />
      </button>
    </foreignObject>
  );
}

function DiodeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 16 16"
    >
      <path d="M1 8 H4 M4 4 L10 8 L4 12 Z M10 3 V13 M10 8 H15" />
    </svg>
  );
}
