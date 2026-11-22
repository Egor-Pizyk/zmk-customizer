import { expect, test } from './test';
import {
  at,
  center,
  corners,
  downloadJson,
  downloadZip,
  drag,
  expectGeometry,
  openProject,
  saved,
  selectKey,
  wiredFixture,
  workspace,
} from './helpers';

test('table typing, Enter, blur and native Escape have visible committed stages @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  const before = await saved(page);
  const rotation = page.getByRole('spinbutton', { name: 'Key 0 Rotation (°)', exact: true });
  await rotation.fill('2');
  await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
  expect(await saved(page)).toEqual(before);
  await rotation.press('Enter');
  await expectGeometry(page, {
    id: 'k0',
    xU: 5,
    yU: 5,
    rotationDeg: 2,
    rotationOriginXU: 5.5,
    rotationOriginYU: 5.5,
  });
  expect((await saved(page)).keys[0]?.rotationDeg).toBe(2);
  const origin = page.getByRole('spinbutton', { name: 'Key 0 Origin X (u)', exact: true });
  await origin.fill('1.5');
  await origin.press('Tab');
  await expectGeometry(page, {
    id: 'k0',
    xU: 5,
    yU: 5,
    rotationDeg: 2,
    rotationOriginXU: 1.5,
    rotationOriginYU: 5.5,
  });
  const committed = await saved(page);
  await origin.fill('7');
  await origin.press('Escape');
  await origin.press('Tab');
  await expect(origin).toHaveValue('1.5');
  expect(await saved(page)).toEqual(committed);
});

test('mouse rotation matches both workspaces, reload, JSON and seven exported physical cells', async ({
  page,
}) => {
  await openProject(page, wiredFixture);
  await selectKey(page);
  const previous = await corners(page);
  const pivot = {
    x: (at(previous, 0).x + at(previous, 2).x) / 2,
    y: (at(previous, 0).y + at(previous, 2).y) / 2,
  };
  const start = await center(
    page.getByRole('button', { name: 'Rotate key 0 bottom right', exact: true }),
  );
  await drag(page, start, { x: pivot.x - (start.y - pivot.y), y: pivot.y + (start.x - pivot.x) });
  const result = await saved(page);
  const geometry = result.keys[0];
  if (geometry === undefined) {
    throw new Error('Missing key');
  }
  expect(geometry).toMatchObject({
    xU: 5,
    yU: 5,
    rotationDeg: 90,
    rotationOriginXU: 5.5,
    rotationOriginYU: 5.5,
  });
  expect(result.wires).toEqual(wiredFixture.wires);
  expect(result.layers).toEqual(wiredFixture.layers);
  await expectGeometry(page, geometry);
  await workspace(page, 'Bindings');
  await expectGeometry(page, geometry);
  await workspace(page, 'Schematic');
  await expectGeometry(page, geometry);
  expect(JSON.parse(await downloadJson(page))).toEqual(result);
  const zip = await downloadZip(page);
  expect(zip['boards/shields/browser_shield/browser_shield.overlay']).toContain(
    '<&key_physical_attrs 100 100 500 500 9000 550 550>',
  );
  expect(zip['config/browser_shield.keymap']).toContain('&kp A');
  await page.reload();
  expect(await saved(page)).toEqual(result);
  await workspace(page, 'Schematic');
  await expectGeometry(page, geometry);
});
