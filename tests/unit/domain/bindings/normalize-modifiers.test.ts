import { normalizeModifiers } from '@domain/bindings';
import { expect, it } from 'vitest';

it('orders unique modifiers without duplicates', () => {
  expect(normalizeModifiers(['RS', 'LC', 'LC'])).toEqual(['LC', 'RS']);
  expect(normalizeModifiers([])).toEqual([]);
});
