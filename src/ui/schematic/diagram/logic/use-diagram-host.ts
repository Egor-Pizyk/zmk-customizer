import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createDiagram } from './create-diagram';
import type { RefObject } from 'react';
import type { KeyInput } from '@ui/schematic/interaction';
import type { Diagram, DiagramInput } from './diagram-types';

export type DiagramHostInput = {
  readonly input: DiagramInput;
  readonly onDispose?: () => void;
  readonly onAvailabilityChange?: (isUnavailable: boolean) => void;
  readonly onKeyKeyDown?: (keyId: string, event: KeyInput) => void;
  readonly onKeyFocus?: (keyId: string) => void;
};

export function useDiagramHost(props: DiagramHostInput) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const handleAvailabilityChange = (unavailable: boolean) => {
    setIsUnavailable(unavailable);
    props.onAvailabilityChange?.(unavailable);
  };
  useDiagramKeyEvents(hostRef, props);
  useDiagramLifetime(hostRef, {
    ...props,
    attempt,
    onAvailabilityChange: handleAvailabilityChange,
  });
  return {
    hostRef,
    isUnavailable,
    retry: () => {
      setAttempt((current) => current + 1);
    },
  };
}

type LifetimeInput = DiagramHostInput & {
  readonly attempt: number;
  readonly onAvailabilityChange: (unavailable: boolean) => void;
};
function useDiagramLifetime(hostRef: RefObject<HTMLDivElement | null>, props: LifetimeInput) {
  const diagramRef = useRef<Diagram | null>(null);
  const invalidateGesture = useEffectEvent(() => props.onDispose?.());
  const mountLatest = useEffectEvent(() => {
    const result = mountDiagram(hostRef.current, props.input);
    diagramRef.current = result.kind === 'ready' ? result : null;
    props.onAvailabilityChange(result.kind === 'unavailable');
    if (props.attempt > 0 && result.kind === 'ready') {
      focusRetriedCanvas(hostRef.current);
    }
  });
  const syncLatest = useEffectEvent((input: DiagramInput) => {
    if (diagramRef.current !== null && !diagramRef.current.sync(input)) {
      invalidateGesture();
      diagramRef.current.dispose();
      diagramRef.current = null;
      props.onAvailabilityChange(true);
    }
  });
  useEffect(() => {
    const host = hostRef.current;
    if (host !== null) {
      host.dataset['diagramGeneration'] = String(props.attempt);
    }
    mountLatest();
    return () => {
      invalidateGesture();
      diagramRef.current?.dispose();
      diagramRef.current = null;
    };
  }, [hostRef, props.attempt]);
  useEffect(() => {
    syncLatest(props.input);
  }, [props.input]);
}
function mountDiagram(host: HTMLElement | null, input: DiagramInput) {
  if (host === null) {
    return { kind: 'unavailable' } as const;
  }
  const result = createDiagram(host);
  if (result.kind === 'ready' && !result.sync(input)) {
    result.dispose();
    return { kind: 'unavailable' } as const;
  }
  return result;
}

function readKeyId(target: EventTarget | null) {
  return target instanceof Element
    ? (target.closest<SVGElement>('[data-key-focus-id]')?.dataset['keyFocusId'] ?? undefined)
    : undefined;
}

function dispatchKeyInput(event: KeyboardEvent, onKeyKeyDown: DiagramHostInput['onKeyKeyDown']) {
  const keyId = readKeyId(event.target);
  if (keyId !== undefined) {
    onKeyKeyDown?.(keyId, event);
  }
}
function dispatchKeyFocus(event: FocusEvent, onKeyFocus: DiagramHostInput['onKeyFocus']) {
  const keyId = readKeyId(event.target);
  if (keyId !== undefined) {
    onKeyFocus?.(keyId);
  }
}

function useDiagramKeyEvents(
  hostRef: RefObject<HTMLDivElement | null>,
  { onKeyKeyDown, onKeyFocus }: Pick<DiagramHostInput, 'onKeyKeyDown' | 'onKeyFocus'>,
) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    dispatchKeyInput(event, onKeyKeyDown);
  });
  const handleFocus = useEffectEvent((event: FocusEvent) => {
    dispatchKeyFocus(event, onKeyFocus);
  });
  useEffect(() => {
    const host = hostRef.current;
    host?.addEventListener('keydown', handleKeyDown);
    host?.addEventListener('focusin', handleFocus);
    return () => {
      host?.removeEventListener('keydown', handleKeyDown);
      host?.removeEventListener('focusin', handleFocus);
    };
  }, [hostRef]);
}

function focusRetriedCanvas(host: HTMLDivElement | null) {
  if (host === null) {
    return;
  }
  const canvas = host.closest<HTMLElement | SVGElement>('[data-canvas-workspace]');
  if (canvas?.contains(host.ownerDocument.activeElement) === true) {
    canvas.focus();
  }
}
