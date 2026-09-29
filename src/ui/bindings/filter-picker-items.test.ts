import { expect, it } from 'vitest';
import { filterPickerItems } from './filter-picker-items';
import { PICKER_TABS } from './picker-tabs';

const ITEMS = PICKER_TABS.flatMap((tab) => tab.rows.flatMap((row) => row.items));

function findIds(query: string): readonly string[] {
  return filterPickerItems(ITEMS, query).map((item) => item.id);
}

it('returns everything for an empty query', () => {
  expect(filterPickerItems(ITEMS, '  ')).toHaveLength(ITEMS.length);
});

it.each([
  ['spa', 'SPACE'],
  ['$', 'DOLLAR'],
  ['volume up', 'K_VOLUME_UP'],
  ['VOLUME INCREMENT', 'C_VOLUME_UP'],
  ['f13', 'F13'],
  ['print screen', 'PRINTSCREEN'],
  ['n4', 'NUMBER_4'],
  ['bootloader', 'Bootloader'],
  ['select profile 1', 'Bluetooth: select profile 1'],
])('finds %s → %s across every tab (SC-002)', (query, id) => {
  expect(findIds(query)).toContain(id);
});

it.each([
  ['C_AC_REFRESH', 'C_AC_REFRESH'],
  ['c_ac_refresh', 'C_AC_REFRESH'],
  ['AC_REFRESH', 'C_AC_REFRESH'],
])('finds %s by ZMK code', (query, id) => {
  expect(findIds(query)).toContain(id);
});

it.each([
  ['refresh', 'C_AC_REFRESH'],
  ['restarts the keyboard', 'Reset'],
  ['stop (k_stop2)', 'K_STOP2'],
])('finds %s by description or qualified name', (query, id) => {
  expect(findIds(query)).toContain(id);
});

it('finds N and numbers for a single n', () => {
  const ids = findIds('n');
  expect(ids).toContain('N');
  expect(ids).toContain('NUMBER_1');
});

it.each(['PRINTSCREEN', 'RETURN', 'Q', 'MINUS', 'W'])('ignores %s for a single n', (id) => {
  expect(findIds('n')).not.toContain(id);
});
