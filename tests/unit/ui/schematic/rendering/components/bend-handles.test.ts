// @vitest-environment jsdom
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { BendHandles } from '@ui/schematic/rendering/components';
import { getDefinedValue } from '../../../../../helpers/defined-value';

it('keeps an eight pixel square inside a fixed 24 pixel pointer target at low zoom', () => {
  const { container } = render(
    createElement(
      'svg',
      {},
      createElement(BendHandles, {
        pxPerU: 24,
        handles: [{ wireId: 'w1', point: { xU: 3, yU: 4 }, bendIndex: undefined }],
      }),
    ),
  );
  const target = getDefinedValue(
    container.querySelector('[data-wire-bend] rect[pointer-events="all"]'),
  );
  const marker = getDefinedValue(
    container.querySelector('[data-wire-bend] rect[pointer-events="none"]'),
  );
  expect(target.getAttribute('stroke-width')).toBe('0');
  expect(Number(target.getAttribute('width')) * 24).toBe(24);
  expect(Number(target.getAttribute('height')) * 24).toBe(24);
  expect(Number(marker.getAttribute('width')) * 24).toBe(8);
  expect(container.querySelectorAll('[data-wire-bend]')).toHaveLength(1);
  const handle = getDefinedValue(container.querySelector<SVGElement>('[data-wire-bend]'));
  expect(handle.dataset['bendXU']).toBe('3');
  expect(handle.dataset['bendYU']).toBe('4');
  expect(handle.dataset['bendIndex']).toBeUndefined();
});

it('moves an existing corner target without detaching and recreating its DOM', () => {
  const { container, rerender } = render(drawHandle(3));
  const handle = getDefinedValue(container.querySelector<SVGElement>('[data-wire-bend]'));
  rerender(drawHandle(4));
  expect(container.querySelector('[data-wire-bend]')).toBe(handle);
  expect(handle.dataset['bendXU']).toBe('4');
});

const drawHandle = (xU: number) =>
  createElement(
    'svg',
    {},
    createElement(BendHandles, {
      pxPerU: 48,
      handles: [{ wireId: 'w1', point: { xU, yU: 4 }, bendIndex: undefined }],
    }),
  );
