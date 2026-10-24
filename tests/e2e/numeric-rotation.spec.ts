import type { Project } from '@domain';
import { expect, test } from '@playwright/test';
import { fixture, openProject, saved, history, expectGeometry, center, distance } from './helpers';

const project = {
  ...fixture,
  wires: [],
  keys: [
    {
      id: 'k0',
      xU: 5,
      yU: 5,
      widthU: 2,
      heightU: 1,
      rotationDeg: 90,
      rotationOriginXU: 5,
      rotationOriginYU: 5,
    },
    { id: 'k1', xU: 10, yU: 5 },
  ],
};

test('numeric table and batch rotation keep independent visible centers @cross-browser', async ({
  page,
}) => {
  await openProject(page, project);
  const before = await saved(page);
  await page.getByRole('spinbutton', { name: 'Key 0 Rotation (°)', exact: true }).fill('-30');
  await page.getByRole('spinbutton', { name: 'Key 0 Rotation (°)', exact: true }).press('Enter');
  const rotated = {
    ...project.keys[0],
    id: 'k0',
    xU: 3.5,
    yU: 5.5,
    rotationDeg: -30,
    rotationOriginXU: 4.5,
    rotationOriginYU: 6,
  };
  await expectGeometry(page, rotated);
  expect((await saved(page)).keys[0]).toMatchObject(rotated);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(before);
  await page.getByRole('checkbox', { name: 'Select key 0', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Select key 1', exact: true }).check();
  await page.getByText('Precise properties', { exact: true }).click();
  const angle = page.getByRole('spinbutton', { name: 'Selected rotation (°)', exact: true });
  await angle.fill('45');
  await angle.press('Enter');
  const first = { ...rotated, rotationDeg: 45 };
  const second = {
    id: 'k1',
    xU: 10,
    yU: 5,
    rotationDeg: 45,
    rotationOriginXU: 10.5,
    rotationOriginYU: 5.5,
  };
  await expectGeometry(page, first);
  await expectGeometry(page, second, 1);
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: 'Cancel preview', exact: true }).click();
  await expectGeometry(page, project.keys[0] ?? rotated);
  await angle.fill('45');
  await angle.press('Enter');
  await page.getByRole('button', { name: 'Apply layout', exact: true }).click();
  const applied = await saved(page);
  expect(applied.keys[0]).toMatchObject(first);
  expect(applied.keys[1]).toMatchObject(second);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(before);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(applied);
  await page.screenshot({ path: '.check-logs/item19-light.png' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: '.check-logs/item19-dark.png' });
  await page.reload();
  expect(await saved(page)).toEqual(applied);
  await expectGeometry(page, first);
});

for (const hasPush of [false, true]) {
  test(`numeric encoder own-center rotation with push ${hasPush} @cross-browser`, async ({
    page,
  }) => {
    const input: Project = {
      ...project,
      encoders: [
        {
          id: 'e0',
          half: 'left',
          xU: 5,
          yU: 5,
          rotationDeg: 0,
          steps: 20,
          triggersPerRotation: 20,
          ...(hasPush ? { pushKeyId: 'k0' } : {}),
        },
      ],
    };
    await openProject(page, input);
    await page.getByText('Encoders', { exact: true }).click();
    const body = page.locator('[data-encoder-id="e0"] circle.cursor-move');
    const pivot = await center(body);
    const angle = page.getByRole('spinbutton', { name: 'Encoder 0 Rotation (°)', exact: true });
    await angle.fill(hasPush ? '0' : '-45');
    await angle.press('Enter');
    const applied = await saved(page);
    expect(distance(await center(body), pivot)).toBeLessThan(0.75);
    await expect(page.locator('[data-encoder-id="e0"][transform]')).toHaveAttribute(
      'transform',
      hasPush ? 'rotate(0 4.5 6)' : 'rotate(-45 5.5 5.5)',
    );
    if (hasPush) {
      expect(applied.keys[0]).toMatchObject({
        xU: 3.5,
        yU: 5.5,
        rotationDeg: 0,
        rotationOriginXU: 4.5,
        rotationOriginYU: 6,
      });
    } else {
      expect(applied.keys).toEqual(input.keys);
      expect(applied.encoders[0]).toMatchObject({ xU: 5, yU: 5, rotationDeg: -45 });
    }
    expect(applied.layers).toEqual(input.layers);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(input);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(applied);
    expect(distance(await center(body), pivot)).toBeLessThan(0.75);
    await page.reload();
    expect(await saved(page)).toEqual(applied);
  });
}
