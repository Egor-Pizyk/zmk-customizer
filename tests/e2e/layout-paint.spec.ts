import { expect, test } from './test';
import { expectGeometry, expectPainted, openProject, saved, selectKey } from './helpers';

test('precise properties keep selected key and unsaved preview visibly inside canvas @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  const before = await saved(page);
  await expectPainted(page);
  await page.getByText('Precise properties', { exact: true }).click();
  await expectPainted(page);
  const width = page.getByRole('spinbutton', { name: 'Selected rotation (°)', exact: true });
  await width.fill('30');
  await width.press('Enter');
  await expectGeometry(page, {
    id: 'k0',
    xU: 5,
    yU: 5,
    rotationDeg: 30,
    rotationOriginXU: 5.5,
    rotationOriginYU: 5.5,
  });
  await expectPainted(page);
  expect(await saved(page)).toEqual(before);
});

test('compact desktop keeps canvas usable when precise properties expand @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openProject(page);
  await selectKey(page);
  const before = await saved(page);
  await page.getByText('Precise properties', { exact: true }).click();
  await expectPainted(page);
  const width = page.getByRole('spinbutton', { name: 'Selected rotation (°)', exact: true });
  await width.fill('30');
  await width.press('Enter');
  await expectGeometry(page, {
    id: 'k0',
    xU: 5,
    yU: 5,
    rotationDeg: 30,
    rotationOriginXU: 5.5,
    rotationOriginYU: 5.5,
  });
  await expectPainted(page);
  expect(await saved(page)).toEqual(before);
});
