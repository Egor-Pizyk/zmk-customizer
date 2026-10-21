import type { Project } from '@domain';
import { getKeyGeometry } from '@domain/geometry';
import { KEYCAP_SIZES } from '@catalog/keycaps';
import { Button, Dialog } from '@ui/components/components';

type KeycapSizeDialogProps = {
  readonly isOpen: boolean;
  readonly project: Project;
  readonly keyIds: readonly string[];
  readonly onClose: () => void;
  readonly onChoose: (sizeId: string) => void;
};

export function KeycapSizeDialog(props: KeycapSizeDialogProps) {
  const geometries = props.project.keys
    .filter((key) => props.keyIds.includes(key.id))
    .map((key) => getKeyGeometry(key));
  const first = geometries[0];
  const isSame =
    first !== undefined &&
    geometries.every((entry) => entry.widthU === first.widthU && entry.heightU === first.heightU);
  const current = isSame
    ? KEYCAP_SIZES.find((size) => size.widthU === first.widthU && size.heightU === first.heightU)
    : undefined;
  return (
    <Dialog isOpen={props.isOpen} onClose={props.onClose} title="Keycap size">
      <p>{`${geometries.length} ${geometries.length === 1 ? 'key' : 'keys'} selected`}</p>
      <p>{formatCurrentSize({ first, isSame, currentLabel: current?.label })}</p>
      <p className="text-sm text-text-muted">
        Sizes keep switch centers and wiring fixed. Larger keycaps may overlap; fix overlaps in
        Schematic before exporting.
      </p>
      <SizeChoices currentId={current?.id} onChoose={props.onChoose} />
      <Button onClick={props.onClose} variant="secondary">
        Cancel
      </Button>
    </Dialog>
  );
}

function formatCurrentSize({
  first,
  isSame,
  currentLabel,
}: {
  readonly first: ReturnType<typeof getKeyGeometry> | undefined;
  readonly isSame: boolean;
  readonly currentLabel: string | undefined;
}) {
  if (!isSame || first === undefined) {
    return 'Mixed sizes';
  }
  if (currentLabel !== undefined) {
    return `Current: ${currentLabel}`;
  }
  return `Custom: ${first.widthU} × ${first.heightU} u`;
}

function SizeChoices({
  currentId,
  onChoose,
}: {
  readonly currentId: string | undefined;
  readonly onChoose: (sizeId: string) => void;
}) {
  return (
    <fieldset className="grid min-w-0 grid-cols-2 gap-2">
      <legend className="mb-2 font-medium">Standard sizes (width × height)</legend>
      {KEYCAP_SIZES.map((size) => (
        <Button
          aria-pressed={currentId === size.id}
          key={size.id}
          onClick={() => {
            onChoose(size.id);
          }}
          variant="secondary"
        >
          {size.label}
          {currentId === size.id ? ' — Current' : ''}
        </Button>
      ))}
    </fieldset>
  );
}
