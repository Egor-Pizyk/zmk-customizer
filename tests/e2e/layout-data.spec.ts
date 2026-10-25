import { expect, test } from './test';
import {
  at,
  center,
  corners,
  downloadJson,
  downloadZip,
  drag,
  editNumber,
  expectGeometry,
  history,
  key,
  openProject,
  saved,
  selectKey,
  wiredFixture,
  workspace,
} from './helpers';

for (const commit of ['Enter', 'blur']) {
  test(`precise numeric ${commit} shows unsaved preview, Cancel/Escape cannot resurrect another value @cross-browser`, async ({
    page,
  }) => {
    await openProject(page);
    await selectKey(page);
    await page.getByText('Precise properties', { exact: true }).click();
    const before = await saved(page);
    const rotation = page.getByRole('spinbutton', { name: 'Selected rotation (°)', exact: true });
    await rotation.fill('2');
    await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
    expect(await saved(page)).toEqual(before);
    await rotation.press(commit === 'Enter' ? 'Enter' : 'Tab');
    await expectGeometry(page, {
      id: 'k0',
      xU: 5,
      yU: 5,
      rotationDeg: 2,
      rotationOriginXU: 5.5,
      rotationOriginYU: 5.5,
    });
    expect(await saved(page)).toEqual(before);
    if (commit === 'Enter') {
      await page.getByRole('button', { name: 'Cancel preview', exact: true }).click();
    } else {
      await key(page).focus();
      await page.keyboard.press('Escape');
    }
    await expect(rotation).toHaveValue('0');
    await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
    await editNumber(page, 'Selected origin X (u)', '3');
    await expectGeometry(page, { id: 'k0', xU: 5, yU: 5, rotationOriginXU: 3 });
    await page.getByRole('button', { name: 'Apply layout', exact: true }).click();
    const result = await saved(page);
    expect(result.keys[0]?.rotationDeg ?? 0).toBe(0);
    expect(result.keys[0]?.rotationOriginXU).toBe(3);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(before);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(result);
  });
}

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

test('changing selection or project invalidates numeric preview @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  await page.getByText('Precise properties', { exact: true }).click();
  const before = await saved(page);
  await editNumber(page, 'Selected rotation (°)', '2');
  await key(page, 1).focus();
  await expect(page.getByRole('button', { name: 'Apply layout', exact: true })).toHaveCount(0);
  await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
  expect(await saved(page)).toEqual(before);
  await editNumber(page, 'Selected origin X (u)', '2');
  await page.getByText('Parts', { exact: true }).click();
  await editNumber(page, 'Key 1 Y (u)', '6');
  await expect(page.getByRole('button', { name: 'Apply layout', exact: true })).toHaveCount(0);
  await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
});

test('single and multi duplicate/delete/renumber preserve identity, all layers, diode and wire references', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  const before = await saved(page);
  await page.getByRole('button', { name: 'Duplicate selected keys', exact: true }).click();
  let copied = await saved(page);
  expect(copied.keys).toHaveLength(3);
  expect(copied.keys[2]?.id).toBe('k2');
  expect(copied.keys[2]?.diode).toEqual(before.keys[0]?.diode);
  for (const layer of copied.layers) {
    expect(layer.bindings['k2']).toEqual(layer.bindings['k0']);
  }
  expect(copied.wires).toEqual(before.wires);
  await expect(key(page, 2)).toBeVisible();
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(before);
  await page.getByRole('checkbox', { name: 'Select key 0', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Select key 1', exact: true }).check();
  await page.getByRole('button', { name: 'Duplicate selected keys', exact: true }).click();
  copied = await saved(page);
  expect(copied.keys.map(({ id }) => id)).toEqual(['k0', 'k1', 'k2', 'k3']);
  expect(copied.wires).toEqual(before.wires);
  for (const layer of copied.layers) {
    expect(layer.bindings['k2']).toEqual(layer.bindings['k0']);
    expect(layer.bindings['k3']).toEqual(layer.bindings['k1']);
  }
  await page.getByRole('button', { name: 'Delete selected keys', exact: true }).click();
  expect((await saved(page)).keys.map(({ id }) => id)).toEqual(['k0', 'k1']);
  await expect(key(page, 2)).toHaveCount(0);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(copied);
  await history(page, 'Undo').click();
  await editNumber(page, 'Key 0 Y (u)', '8');
  const moved = await saved(page);
  await page.getByRole('button', { name: 'Renumber by position', exact: true }).click();
  const renumbered = await saved(page);
  expect(renumbered.keys.map(({ id }) => id)).toEqual(['k1', 'k0']);
  expect(renumbered.layers).toEqual(moved.layers);
  expect(renumbered.wires).toEqual(moved.wires);
  await expectGeometry(page, moved.keys[0] ?? { id: 'k0', xU: 5, yU: 8 }, 1);
  await page.getByRole('button', { name: 'Delete key 1', exact: true }).click();
  const deleted = await saved(page);
  expect(deleted.keys.map(({ id }) => id)).toEqual(['k1']);
  expect(deleted.layers.map(({ bindings }) => Object.keys(bindings))).toEqual([['k1'], ['k1']]);
  expect(
    deleted.wires.every((wire) => wire.start.kind !== 'key-pin' || wire.start.keyId !== 'k0'),
  ).toBe(true);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(renumbered);
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
