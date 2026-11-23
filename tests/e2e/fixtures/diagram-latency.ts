import type { Page } from '@playwright/test';

/** Native capture listener measures scheduling opportunity, never actual paint. */
export async function recordDiagramLatency(page: Page) {
  return page.evaluateHandle(() => {
    let isRecording = false;
    let start = 0;
    const samples: number[] = [];
    const tasks: { start: number; duration: number }[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        tasks.push({ start: entry.startTime, duration: entry.duration });
      }
    });
    observer.observe({ type: 'longtask', buffered: false });
    const handleMove = () => {
      if (!isRecording) {
        return;
      }
      const entered = performance.now();
      if (start === 0) {
        start = entered;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          samples.push(performance.now() - entered);
        });
      });
    };
    document.addEventListener('pointermove', handleMove, true);
    return {
      start: () => {
        isRecording = true;
      },
      finish: async () => {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
        isRecording = false;
        const end = performance.now();
        for (const entry of observer.takeRecords()) {
          tasks.push({ start: entry.startTime, duration: entry.duration });
        }
        observer.disconnect();
        document.removeEventListener('pointermove', handleMove, true);
        return {
          samples,
          tasks: tasks.filter((task) => task.start >= start && task.start <= end),
          start,
          end,
        };
      },
    };
  });
}

export async function moveDiagramPointer(
  page: Page,
  origin: { readonly x: number; readonly y: number },
  count: number,
) {
  for (let index = 0; index < count; index += 1) {
    const step = index % 20;
    const offset = (step <= 10 ? step : 20 - step) * 3;
    await page.mouse.move(origin.x + offset, origin.y + offset / 2);
    // The protocol requires delivered moves at >=20ms spacing, not a UI readiness wait.
    await page.waitForTimeout(20);
  }
}
export function percentile95(samples: readonly number[]) {
  const sorted = samples.toSorted((first, second) => first - second);
  const value = sorted[Math.ceil(0.95 * sorted.length) - 1];
  if (value === undefined) {
    throw new Error('Missing latency samples');
  }
  return value;
}
