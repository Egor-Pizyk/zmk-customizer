import { toShieldName } from '@domain/project';
import { expect, it } from 'vitest';

it.each([
  ['My Corne v2!', 'my_corne_v2'],
  ['42 keys', '_42_keys'],
  ['!!!', ''],
  ['Корн', ''],
  ['', ''],
  ['  a--b  ', 'a_b'],
  ['My keyboard', 'my_keyboard'],
  ['ÄBC', 'bc'],
])('derives %j → %j', (name, shieldName) => {
  expect(toShieldName(name)).toBe(shieldName);
});
