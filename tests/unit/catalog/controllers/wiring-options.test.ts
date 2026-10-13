import { expect, it } from 'vitest';
import { WIRING_OPTIONS } from '@catalog/controllers';

it('provides descriptions and pinned ZMK documentation for every wiring choice', () => {
  expect(
    Object.values(WIRING_OPTIONS)
      .flat()
      .map((option) => ({
        description: option.description.length > 0,
        docs: option.docsUrl.startsWith('https://v0-3-branch.zmk.dev/docs/'),
      })),
  ).toEqual(Array.from({ length: 6 }, () => ({ description: true, docs: true })));
});
