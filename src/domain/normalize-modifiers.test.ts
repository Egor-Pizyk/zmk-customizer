import { expect, it } from 'vitest';
import { normalizeModifiers } from './normalize-modifiers';

it('orders unique modifiers without duplicates', () => {
  expect(normalizeModifiers(['RS', 'LC', 'LC'])).toEqual(['LC', 'RS']);
  expect(normalizeModifiers([])).toEqual([]);
});
