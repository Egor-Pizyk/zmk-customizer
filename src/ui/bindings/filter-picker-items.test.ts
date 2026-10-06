import { expect, it } from 'vitest';
import { filterPickerItems } from './filter-picker-items';
import { getSlotChoices } from './slot-choices';

const ITEMS = (['key', 'bt-command', 'out-command'] as const).flatMap((kind) =>
  getSlotChoices({ kind }).flatMap((group) => group.items),
);

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
  ['usb', 'OUT_USB'],
  ['select profile', 'BT_SEL'],
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
  ['sends keys over usb', 'OUT_USB'],
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
