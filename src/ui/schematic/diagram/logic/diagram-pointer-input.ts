import { readCanvasHit } from '@ui/schematic/interaction';
import type { CanvasHit, SchematicPointerInput } from '@ui/schematic/interaction';
import { resolveDiagramHit } from './diagram-hit-reference';
import type { Project, WirePoint } from '@domain';

type NativePointerInput = Pick<
  PointerEvent,
  | 'clientX'
  | 'clientY'
  | 'target'
  | 'pointerId'
  | 'timeStamp'
  | 'shiftKey'
  | 'ctrlKey'
  | 'metaKey'
  | 'preventDefault'
> & {
  readonly currentTarget: HTMLElement | SVGSVGElement;
};

export function normalizeDiagramPointerInput(input: {
  readonly world: WirePoint;
  readonly event: NativePointerInput;
  readonly project: Project;
}): SchematicPointerInput {
  const { event, world } = input;
  const element = event.currentTarget;
  const pointerId = event.pointerId;
  return {
    world,
    target: event.target,
    hit: resolveDiagramHit(input.project, readDiagramHit(event)),
    pointerId,
    timeStamp: event.timeStamp,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    capture: () => {
      element.setPointerCapture(pointerId);
    },
    release: () => {
      if (element.hasPointerCapture(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
    },
    focus: () => {
      focusDiagramTarget(element, event.target);
    },
    preventDefault: () => {
      event.preventDefault();
    },
  };
}

function readDiagramHit(event: NativePointerInput) {
  const hit = readCanvasHit(event.target);
  if (hit.kind !== 'bend') {
    return hit;
  }
  // Native corner overlays paint above the Paper. Preserve the established higher pin/end/
  // encoder priority using the actual painted DOM stack, never inferred circuit geometry.
  const elements = event.currentTarget.ownerDocument
    .elementsFromPoint(event.clientX, event.clientY)
    .filter((element) => event.currentTarget.contains(element));
  for (const element of elements) {
    const underlying = readCanvasHit(element);
    if (
      underlying.kind === 'pin' ||
      underlying.kind === 'wire-end' ||
      underlying.kind === 'encoder' ||
      underlying.kind === 'encoder-pin'
    ) {
      return underlying;
    }
  }
  return nearestBend(elements, event, hit);
}

function nearestBend(elements: readonly Element[], event: NativePointerInput, fallback: CanvasHit) {
  let nearest = fallback;
  let distance = Number.POSITIVE_INFINITY;
  for (const element of elements) {
    const control = element.closest('[data-wire-bend]');
    if (control === null) {
      continue;
    }
    const bounds = control.getBoundingClientRect();
    const candidateDistance = Math.hypot(
      bounds.x + bounds.width / 2 - event.clientX,
      bounds.y + bounds.height / 2 - event.clientY,
    );
    if (candidateDistance < distance) {
      nearest = readCanvasHit(control);
      distance = candidateDistance;
    }
  }
  return nearest;
}

function focusDiagramTarget(host: HTMLElement | SVGSVGElement, target: EventTarget | null) {
  const key = target instanceof Element ? target.closest<SVGElement>('[data-key-focus-id]') : null;
  if (key !== null && host.contains(key)) {
    key.focus();
    return;
  }
  host.focus();
}
