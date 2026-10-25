import type { Locator } from '@playwright/test';

export async function readPaths(paths: Locator) {
  return paths.evaluateAll((elements) => elements.map((element) => element.getAttribute('d')));
}

export async function visibleSection(paths: Locator) {
  return paths.evaluateAll((elements) => {
    for (const element of elements) {
      if (!(element instanceof SVGPathElement)) {
        continue;
      }
      const matrix = element.getScreenCTM();
      if (matrix === null) {
        continue;
      }
      for (const fraction of [0.37, 0.61, 0.83]) {
        const point = element
          .getPointAtLength(element.getTotalLength() * fraction)
          .matrixTransform(matrix);
        const section = element.parentElement;
        if (document.elementFromPoint(point.x, point.y)?.closest('[data-section-id]') === section) {
          return { x: point.x, y: point.y, id: section?.dataset['sectionId'] ?? '' };
        }
      }
    }
    throw new Error('No visible clickable conductor');
  });
}
