import { expect, test } from './test';
import { expectGeometry, expectPainted, openProject, saved, selectKey } from './helpers';

test('table properties keep selected key and table edit visibly inside canvas @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  await expectPainted(page);
  await expectPainted(page);
  const width = page.getByRole('spinbutton', { name: 'Key 0 Rotation (°)', exact: true });
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
  expect((await saved(page)).keys[0]?.rotationDeg).toBe(30);
});

test('compact desktop keeps canvas usable when table properties expand @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openProject(page);
  await selectKey(page);
  await expectPainted(page);
  const width = page.getByRole('spinbutton', { name: 'Key 0 Rotation (°)', exact: true });
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
  expect((await saved(page)).keys[0]?.rotationDeg).toBe(30);
});
