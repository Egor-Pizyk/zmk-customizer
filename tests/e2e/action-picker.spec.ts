import { expect, test } from '@playwright/test';
import { history, openProject, saved, workspace } from './helpers';

test('action and key pickers use one grouped list without category tabs @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await workspace(page, 'Bindings');
  const choose = page.getByRole('button', { name: 'Choose action for key 0', exact: true });
  if (!(await choose.isVisible())) {
    await page.getByRole('heading', { name: 'Keys', exact: true }).click();
  }
  await choose.click();
  const binding = page.getByRole('region', { name: 'Binding', exact: true });
  await binding.getByRole('button').first().click();
  const behaviors = page.getByRole('region', { name: 'What should the key do?', exact: true });
  await expect(behaviors.getByRole('navigation')).toHaveCount(0);
  await expect(behaviors.getByRole('tab')).toHaveCount(0);
  await expect(behaviors.getByRole('heading', { name: /^Send a key/u })).toBeVisible();
  await behaviors.getByRole('button', { name: /^Key press/u }).click();
  const keys = page.getByRole('region', { name: 'Which key?', exact: true });
  await expect(keys.getByRole('navigation')).toHaveCount(0);
  await expect(keys.getByRole('tab')).toHaveCount(0);
  await expect(keys.getByRole('heading', { name: /^Letters/u })).toBeVisible();
  const search = keys.getByRole('searchbox', {
    name: 'Search by name, code or symbol',
    exact: true,
  });
  await search.fill('BSPC');
  await expect(keys.getByRole('heading', { name: /^Editing/u })).toBeVisible();
  await search.press('ArrowDown');
  await expect(keys.getByRole('button', { name: 'Backspace', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  expect((await saved(page)).layers[0]?.bindings['k0']).toEqual({
    kind: 'kp',
    key: { keycode: 'BACKSPACE', modifiers: [] },
  });
  await expect(page.getByRole('cell', { name: 'Backspace', exact: true })).toBeVisible();
  await history(page, 'Undo').click();
  expect((await saved(page)).layers[0]?.bindings['k0']).toEqual({
    kind: 'kp',
    key: { keycode: 'A', modifiers: [] },
  });
});
