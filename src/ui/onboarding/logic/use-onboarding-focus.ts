import { useEffect, useEffectEvent } from 'react';

function restrictBackground(parent: Element, allowed: readonly Element[], changed: HTMLElement[]) {
  for (const child of parent.children) {
    if (
      !(child instanceof HTMLElement) ||
      allowed.some((item) => item === child || item.contains(child))
    ) {
      continue;
    }
    if (allowed.some((item) => child.contains(item))) {
      restrictBackground(child, allowed, changed);
      continue;
    }
    if (!child.inert) {
      child.inert = true;
      changed.push(child);
    }
  }
}
function hasNestedEscape(event: KeyboardEvent): boolean {
  return (
    event.defaultPrevented ||
    document.querySelector('dialog[open], [popover]:popover-open') !== null ||
    (event.target instanceof Element && event.target.closest('[data-action-panel]') !== null)
  );
}
export function useOnboardingFocus(targetId: string, stepId: string, onExit: () => void) {
  const exit = useEffectEvent(onExit);
  useEffect(() => {
    const panel = document.querySelector<HTMLElement>('[data-onboarding-panel]');
    const id = targetId === 'hardware-discovery' ? 'workspace' : targetId;
    const target = document.querySelector<HTMLElement>(`[data-onboarding-target="${id}"]`);
    const allowed = [
      panel,
      target,
      document.querySelector('[role="status"]'),
      ...document.querySelectorAll('dialog'),
    ].filter((item) => item !== null);
    const changed: HTMLElement[] = [];
    restrictBackground(document.body, allowed, changed);
    if (panel !== null) {
      panel.dataset['onboardingStep'] = stepId;
    }
    const frame = requestAnimationFrame(() => {
      panel?.querySelector<HTMLElement>('h2')?.focus();
    });
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        cycleFocus(event, allowed);
      }
      if (event.key === 'Escape' && !hasNestedEscape(event)) {
        event.preventDefault();
        exit();
      }
    }
    globalThis.addEventListener('keydown', handleEscape);
    return () => {
      cancelAnimationFrame(frame);
      for (const element of changed) {
        element.inert = false;
      }
      globalThis.removeEventListener('keydown', handleEscape);
    };
  }, [targetId, stepId]);
}

function cycleFocus(event: KeyboardEvent, allowed: readonly Element[]) {
  if (document.querySelector('dialog[open]') !== null) {
    return;
  }
  const controls = [
    ...document.querySelectorAll<HTMLElement>(
      'button:not([tabindex="-1"]),input,textarea,select,a[href],[tabindex="0"]',
    ),
  ].filter(
    (element) =>
      element.closest('[inert]') === null &&
      element.getClientRects().length > 0 &&
      allowed.some((root) => root.contains(element)),
  );
  const first = controls[0];
  const last = controls.at(-1);
  if (!event.shiftKey && document.activeElement === last && first !== undefined) {
    event.preventDefault();
    first.focus();
  }
  if (event.shiftKey && document.activeElement === first && last !== undefined) {
    event.preventDefault();
    last.focus();
  }
}
