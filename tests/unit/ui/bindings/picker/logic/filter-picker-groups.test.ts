import { expect, it } from 'vitest';
import { filterPickerGroups, getSlotChoices } from '@ui/bindings/picker/logic';

const groups = getSlotChoices({ kind: 'key' }, { layers: [], docsUrl: '' });

it('matches category words and mixed category/key names without changing catalog entries', () => {
  const letters = groups.find((group) => group.id === 'letters');
  expect(filterPickerGroups(groups, '  LeTtErS  ')).toEqual([letters]);
  expect(
    filterPickerGroups(groups, 'letters z').flatMap((group) => group.items.map((item) => item.id)),
  ).toEqual(['Z']);
  expect(filterPickerGroups(groups, 'not-a-category')).toEqual([]);
  expect(filterPickerGroups(groups, '')).toEqual(groups);
});

it('preserves exact item identity, aliases and symbol search', () => {
  for (const search of ['RETURN', 'enter', '!']) {
    const matches = filterPickerGroups(groups, search).flatMap((group) => group.items);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((item) => groups.some((group) => group.items.includes(item)))).toBe(true);
  }
});
