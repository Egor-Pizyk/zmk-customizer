import { assertNever } from '@domain';
import type { KeyPin, Project, WireEnd, WirePoint } from '@domain';
import { canAddWire } from '@domain/wires';
import { formatWireCheck } from '@ui/schematic/formatting';

/** What the pointer hit; `point` is the pin position, the nearest wire point or the snapped spot. */
export type DraftTarget =
  | {
      readonly kind: 'key-pin';
      readonly keyId: string;
      readonly pin: KeyPin;
      readonly point: WirePoint;
    }
  | {
      readonly kind: 'wire';
      readonly wireId: string;
      readonly point: WirePoint;
      readonly attachmentPoint?: WirePoint;
    }
  | { readonly kind: 'empty'; readonly point: WirePoint };

export type WireDraft = {
  readonly start: WireEnd;
  readonly startPoint: WirePoint;
  readonly bends: readonly WirePoint[];
  readonly lastClick: { readonly point: WirePoint; readonly timeMs: number };
};

export type WireDraftEvent =
  | {
      readonly kind: 'click';
      readonly target: DraftTarget;
      readonly timeMs: number;
      /** Current project, so a draft never finishes onto a key or wire deleted meanwhile. */
      readonly project: Project;
    }
  | { readonly kind: 'cancel' };

export type WireDraftResult = {
  readonly draft: WireDraft | undefined;
  readonly finished?: {
    readonly start: WireEnd;
    readonly end: WireEnd;
    readonly bends: readonly WirePoint[];
  };
  readonly hint?: string;
};

const DOUBLE_CLICK_MS = 400;
// About 7 px at 100% zoom: pointer jitter between the two clicks must not defeat it (snap off).
const DOUBLE_CLICK_TOLERANCE_U = 0.15;

function toEnd(target: DraftTarget): WireEnd {
  switch (target.kind) {
    case 'key-pin': {
      return { kind: 'key-pin', keyId: target.keyId, pin: target.pin };
    }
    case 'wire': {
      return {
        kind: 'junction',
        wireId: target.wireId,
        at: target.attachmentPoint ?? target.point,
      };
    }
    case 'empty': {
      return { kind: 'free', at: target.point };
    }
    default: {
      return assertNever(target);
    }
  }
}

function isDoubleClick(draft: WireDraft, target: DraftTarget, timeMs: number): boolean {
  const { point, timeMs: lastTimeMs } = draft.lastClick;
  return (
    timeMs - lastTimeMs <= DOUBLE_CLICK_MS &&
    Math.abs(point.xU - target.point.xU) <= DOUBLE_CLICK_TOLERANCE_U &&
    Math.abs(point.yU - target.point.yU) <= DOUBLE_CLICK_TOLERANCE_U
  );
}

function finish(
  project: Project,
  input: { readonly draft: WireDraft; readonly end: WireEnd; readonly bends: readonly WirePoint[] },
): WireDraftResult {
  const { start } = input.draft;
  const { end, bends } = input;
  const check = canAddWire(project, { start, end });
  return check === 'ok'
    ? { draft: undefined, finished: { start, end, bends } }
    : { draft: undefined, hint: formatWireCheck(check) };
}

// Click-click drawing (003 R9): clicks on empty spots add bends; a pin or a wire finishes; a
// double-click on an empty spot finishes with a free end there; Escape cancels.
export function reduceWireDraft(
  draft: WireDraft | undefined,
  event: WireDraftEvent,
): WireDraftResult {
  if (event.kind === 'cancel') {
    return { draft: undefined };
  }
  const { target, timeMs, project } = event;
  const lastClick = { point: target.point, timeMs };
  if (draft === undefined) {
    return { draft: { start: toEnd(target), startPoint: target.point, bends: [], lastClick } };
  }
  if (target.kind !== 'empty') {
    return finish(project, { draft, end: toEnd(target), bends: draft.bends });
  }
  if (isDoubleClick(draft, target, timeMs)) {
    const end = { kind: 'free', at: draft.lastClick.point } as const;
    return finish(project, { draft, end, bends: draft.bends.slice(0, -1) });
  }
  return { draft: { ...draft, bends: [...draft.bends, target.point], lastClick } };
}
