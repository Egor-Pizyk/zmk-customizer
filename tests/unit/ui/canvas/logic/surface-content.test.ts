// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { toContentView, toWorldPoint } from '@ui/canvas/logic';

it('uses the same measured bounds and camera for HTML and SVG surfaces', () => {
  const viewport = { zoom: 2, panXPx: 10, panYPx: 20 };
  for (const element of [
    document.createElement('div'),
    document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
  ]) {
    element.getBoundingClientRect = () => new DOMRect(100, 200, 400, 300);
    expect(toWorldPoint({ clientX: 206, clientY: 316, currentTarget: element }, viewport)).toEqual({
      xU: 1,
      yU: 1,
    });
  }
  expect(toContentView(viewport)).toEqual({ ...viewport, pxPerU: 96 });
});
