import { useState } from 'react';
import type { PointerEvent } from 'react';
import type { Project } from '@domain';
import type { Marquee } from '@ui/canvas/components';
import type { WorldPoint } from '@ui/canvas/logic';
import { findKeysInMarquee } from './find-keys-in-marquee';

type BindingsPointerOptions = {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly onSelectionChange: (keyIds: readonly string[]) => void;
  /** A press on a keycap's behavior tag: open its behavior slot (spec 006 FR-013). */
  readonly onTagPress: () => void;
};

// A drag shorter than this is a click on empty space, which clears the selection.
const MIN_MARQUEE_U = 0.1;

function findKeycapId(event: PointerEvent<SVGSVGElement>): string | undefined {
  return event.target instanceof Element
    ? (event.target.closest<SVGGElement>('[data-keycap-id]')?.dataset['keycapId'] ?? undefined)
    : undefined;
}

function isTagPress(event: PointerEvent<SVGSVGElement>): boolean {
  return event.target instanceof Element && event.target.closest('[data-keycap-tag]') !== null;
}

function toggleKeyId(keyIds: readonly string[], keyId: string): readonly string[] {
  return keyIds.includes(keyId) ? keyIds.filter((id) => id !== keyId) : [...keyIds, keyId];
}

function isClick(marquee: Marquee): boolean {
  return (
    Math.abs(marquee.end.xU - marquee.start.xU) < MIN_MARQUEE_U &&
    Math.abs(marquee.end.yU - marquee.start.yU) < MIN_MARQUEE_U
  );
}

// Ctrl/Cmd toggles the key in the selection; a plain press selects it, and on its behavior tag
// also opens the behavior slot.
function pressKeycap(
  input: Pick<BindingsPointerOptions, 'selectedKeyIds' | 'onSelectionChange' | 'onTagPress'> & {
    readonly keyId: string;
    readonly event: PointerEvent<SVGSVGElement>;
  },
) {
  const { keyId, event } = input;
  if (event.ctrlKey || event.metaKey) {
    input.onSelectionChange(toggleKeyId(input.selectedKeyIds, keyId));
    return;
  }
  input.onSelectionChange([keyId]);
  if (isTagPress(event)) {
    input.onTagPress();
  }
}

// Selection only: nothing on the Bindings canvas moves or commits (spec 004 FR-002, FR-005).
export function useBindingsPointer({
  project,
  selectedKeyIds,
  onSelectionChange,
  onTagPress,
}: BindingsPointerOptions) {
  const [marquee, setMarquee] = useState<Marquee | undefined>();

  function handlePointerDown(world: WorldPoint, event: PointerEvent<SVGSVGElement>) {
    const keyId = findKeycapId(event);
    if (keyId === undefined) {
      setMarquee({ start: world, end: world });
      return;
    }
    pressKeycap({ keyId, event, selectedKeyIds, onSelectionChange, onTagPress });
  }

  function handlePointerMove(world: WorldPoint) {
    if (marquee !== undefined) {
      setMarquee({ ...marquee, end: world });
    }
  }

  function handlePointerUp() {
    if (marquee === undefined) {
      return;
    }
    onSelectionChange(isClick(marquee) ? [] : findKeysInMarquee(project.keys, marquee));
    setMarquee(undefined);
  }

  function handlePointerCancel() {
    setMarquee(undefined);
  }

  return {
    marquee,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
