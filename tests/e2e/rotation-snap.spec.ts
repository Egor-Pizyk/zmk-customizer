import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { center, fixture, history, openProject, saved, selectKey } from './helpers';
import type { Point } from './helpers';

function normalize(angle: number): number {
  return ((((angle + 180) % 360) + 360) % 360) - 180;
}

async function rotatePointer(
  page: Page,
  input: { readonly pivot: Point; readonly startAngle: number; readonly deltaDeg: number },
) {
  const angle = input.startAngle + (input.deltaDeg * Math.PI) / 180;
  await page.mouse.move(
    Math.round(input.pivot.x + 180 * Math.cos(angle)),
    Math.round(input.pivot.y + 180 * Math.sin(angle)),
  );
}

for (const part of ['key', 'encoder'] as const) {
  for (const target of [0, 90, 120, 180]) {
    test(`${part} slowly captures ${target} degrees and commits once @cross-browser`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: part === 'encoder' ? 'dark' : 'light' });
      const initial = target - 8;
      await openProject(page, {
        ...fixture,
        keys: [
          {
            id: 'k0',
            xU: 5,
            yU: 5,
            rotationDeg: initial,
            rotationOriginXU: 5.5,
            rotationOriginYU: 5.5,
          },
        ],
        encoders:
          part === 'encoder'
            ? [
                {
                  id: 'e1',
                  xU: 5,
                  yU: 5,
                  half: 'left',
                  steps: 20,
                  triggersPerRotation: 20,
                  wiringMode: 'schematic',
                  pushKeyId: 'k0',
                },
              ]
            : [],
        wires: [],
        insulatedCrossings: [],
        layers: [{ id: 'l0', name: 'Base', bindings: {} }],
      });
      if (part === 'encoder') {
        const body = await center(page.locator('[data-encoder-id="e1"] circle.cursor-move'));
        await page.mouse.click(body.x, body.y);
      } else {
        await selectKey(page);
      }
      const before = await saved(page);
      const pivot = await center(
        part === 'key'
          ? page.locator('[data-key-focus-id="k0"] rect').first()
          : page.locator('[data-encoder-id="e1"] circle.cursor-move'),
      );
      const handle =
        part === 'key'
          ? page.getByRole('button', { name: 'Rotate key 0 bottom right', exact: true })
          : page.locator('[data-encoder-rotate="e1"]').first();
      const handleCenter = await center(handle);
      const start = { x: Math.round(handleCenter.x), y: Math.round(handleCenter.y) };
      const startAngle = Math.atan2(start.y - pivot.y, start.x - pivot.x);
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      for (let step = 0; step <= 40; step += 1) {
        await rotatePointer(page, { pivot, startAngle, deltaDeg: step * 0.15 });
      }
      const expected = normalize(target);
      const drawing =
        part === 'key'
          ? page.locator('[data-key-focus-id="k0"]')
          : page.locator('[data-encoder-id="e1"][transform]');
      await expect(drawing).toHaveAttribute('transform', `rotate(${expected} 5.5 5.5)`);
      if (target === 120) {
        await rotatePointer(page, { pivot, startAngle, deltaDeg: 14 });
        await expect(drawing).toHaveAttribute('transform', `rotate(${expected} 5.5 5.5)`);
        await rotatePointer(page, { pivot, startAngle, deltaDeg: 16 });
        await expect(drawing).not.toHaveAttribute('transform', `rotate(${expected} 5.5 5.5)`);
        for (let step = 0; step <= 40; step += 1) {
          await rotatePointer(page, { pivot, startAngle, deltaDeg: 16 - step * 0.15 });
        }
        await expect(drawing).toHaveAttribute('transform', `rotate(${expected} 5.5 5.5)`);
      }
      expect(await saved(page)).toEqual(before);
      await page.mouse.up();
      const result = await saved(page);
      expect(result.keys[0]?.rotationDeg).toBe(expected);
      expect(result.keys[0]?.xU).toBe(5);
      expect(result.keys[0]?.yU).toBe(5);
      await page.screenshot({ path: test.info().outputPath('magnetic-rotation.png') });
      await history(page, 'Undo').click();
      expect(await saved(page)).toEqual(before);
      if (target === 120) {
        await page.getByRole('button', { name: 'Snap to grid', exact: true }).click();
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        for (let step = 0; step <= 40; step += 1) {
          await rotatePointer(page, { pivot, startAngle, deltaDeg: step * 0.15 });
        }
        const transform = await drawing.getAttribute('transform');
        const freeAngle = Number(transform?.match(/^rotate\(([-\d.]+)/u)?.[1]);
        expect(freeAngle).toBeCloseTo(118, 0);
        await page.keyboard.down('Shift');
        await rotatePointer(page, { pivot, startAngle, deltaDeg: 6.2 });
        await expect(drawing).toHaveAttribute('transform', `rotate(${expected} 5.5 5.5)`);
        await page.keyboard.up('Shift');
        await page.keyboard.press('Escape');
        await page.mouse.up();
        expect(await saved(page)).toEqual(before);
      }
      await history(page, 'Redo').click();
      expect(await saved(page)).toEqual(result);
    });
  }
}
