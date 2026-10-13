import { expect, it } from 'vitest';
import { normalizeModifiers } from '@domain';

it('orders unique modifiers without duplicates', () => {
  expect(normalizeModifiers(['RS', 'LC', 'LC'])).toEqual(['LC', 'RS']);
  expect(normalizeModifiers([])).toEqual([]);
});
