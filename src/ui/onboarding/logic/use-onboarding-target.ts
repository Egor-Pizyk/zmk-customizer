import { useEffect, useState } from 'react';

type Bounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};
type Measurement = { readonly revision: string; readonly bounds: Bounds | undefined };
type TargetInput = { readonly targetId: string; readonly revision: string };
export function useOnboardingTarget(input: TargetInput) {
  const [measurement, setMeasurement] = useState<Measurement>();
  const { targetId, revision } = input;
  useEffect(() => {
    const id = targetId === 'hardware-discovery' ? 'workspace' : targetId;
    function measure() {
      const bounds = readBounds(id);
      setMeasurement((previous) =>
        previous?.revision === revision &&
        JSON.stringify(previous.bounds) === JSON.stringify(bounds)
          ? previous
          : { revision, bounds },
      );
    }
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    const target = document.querySelector(`[data-onboarding-target="${id}"]`);
    if (target !== null) {
      observer.observe(target);
    }
    const mutations = new MutationObserver(measure);
    mutations.observe(document.body, { childList: true, subtree: true });
    function reveal() {
      revealTarget(id, revision);
      measure();
    }
    const frame = requestAnimationFrame(reveal);
    globalThis.addEventListener('resize', reveal);
    document.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      globalThis.removeEventListener('resize', reveal);
      document.removeEventListener('scroll', measure, true);
    };
  }, [targetId, revision]);
  return measurement?.revision === revision ? measurement.bounds : undefined;
}

function readBounds(id: string): Bounds | undefined {
  const rect = document
    .querySelector<HTMLElement>(`[data-onboarding-target="${id}"]`)
    ?.getBoundingClientRect();
  return rect === undefined || rect.width === 0 || rect.height === 0
    ? undefined
    : { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function revealTarget(id: string, revision: string) {
  const target = document.querySelector<HTMLElement>(`[data-onboarding-target="${id}"]`);
  const element = revision.startsWith('layout:')
    ? target?.querySelector<HTMLElement>('[data-parts-add="key"]')
    : target;
  let visible = element;
  let details = element?.closest('details');
  while (details !== null && details !== undefined) {
    if (!details.open) {
      visible = details.querySelector<HTMLElement>('summary') ?? undefined;
    }
    details = details.parentElement?.closest('details');
  }
  visible?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}
