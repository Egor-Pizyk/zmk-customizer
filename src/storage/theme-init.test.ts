import { expect, it } from 'vitest';
import themeInitSource from '../../public/theme-init.js?raw';
import { PREFERENCES_STORAGE_KEY } from './preferences';

it('reads the same storage key as the preferences store', () => {
  expect(themeInitSource.includes(PREFERENCES_STORAGE_KEY)).toBe(true);
});
