import { getResultValue, getResultError } from '../../../helpers/result';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseKleLayout, readKleFile } from '@storage/kle';
import { UNIBODY_PRESET } from '@catalog/presets';
import { getKeyGeometry } from '@domain/geometry';

function fixture(name: string) {
  return readFileSync(`tests/fixtures/kle/${name}.json`, 'utf8');
}

describe('KLE layout import', () => {
  it('matches independently authored starter preset geometry', () => {
    const parsed = parseKleLayout(fixture('unibody-six'));
    expect(parsed.ok).toBe(true);
    expect(getResultValue(parsed).geometries).toEqual(
      UNIBODY_PRESET.keys.map((key) => getKeyGeometry(key)),
    );
  });

  it('preserves offsets, one-key sizes, cluster resets and source order', () => {
    const parsed = parseKleLayout(fixture('clusters'));
    expect(parsed.ok).toBe(true);
    expect(getResultValue(parsed).geometries).toEqual([
      {
        xU: 2,
        yU: 2.25,
        widthU: 1.5,
        heightU: 2,
        rotationDeg: 15,
        rotationOriginXU: 3,
        rotationOriginYU: 2,
      },
      {
        xU: 3.5,
        yU: 2.25,
        widthU: 1,
        heightU: 1,
        rotationDeg: 15,
        rotationOriginXU: 3,
        rotationOriginYU: 2,
      },
      {
        xU: 3.5,
        yU: 3.25,
        widthU: 1,
        heightU: 1,
        rotationDeg: 15,
        rotationOriginXU: 3,
        rotationOriginYU: 2,
      },
      {
        xU: 2.5,
        yU: 6,
        widthU: 1,
        heightU: 1,
        rotationDeg: -30,
        rotationOriginXU: 3,
        rotationOriginYU: 6,
      },
    ]);
    expect(getResultValue(parsed).warnings.join(' ')).toMatch(/metadata/iu);
    expect(getResultValue(parsed).warnings.join(' ')).toMatch(/legends/iu);
  });

  it('skips decals, advances their cursor and reports approximations/unknown fields', () => {
    const parsed = parseKleLayout(
      '[[{"d":true,"w":2},"logo",{"x2":0.25,"w2":1.5,"c":"red","mystery":1},"A","B"]]',
    );
    expect(parsed.ok).toBe(true);
    expect(getResultValue(parsed).geometries.map(({ xU, widthU }) => ({ xU, widthU }))).toEqual([
      { xU: 2, widthU: 1 },
      { xU: 3, widthU: 1 },
    ]);
    expect(getResultValue(parsed).warnings.join(' ')).toMatch(/decal/iu);
    expect(getResultValue(parsed).warnings.join(' ')).toMatch(/primary rectangle/iu);
    expect(getResultValue(parsed).warnings.join(' ')).toContain('mystery');
  });

  it.each([
    'bad',
    '{}',
    '[]',
    '[[]]',
    '["A"]',
    '[[null]]',
    '[[7]]',
    '[[{}],{}]',
    '[[{"x":"2"},"A"]]',
    '[[{"w":0},"A"]]',
    '[[{"h":-1},"A"]]',
    '[[{"d":1},"A"]]',
    '[[{"x":1e999},"A"]]',
    '[["A",{"r":10},"B"]]',
    '[[{"d":true},"logo"]]',
  ])('rejects invalid layout %s', (text) => {
    const parsed = parseKleLayout(text);
    expect(parsed.ok).toBe(false);
    expect(getResultError(parsed).length).toBeGreaterThan(10);
  });

  it('names invalid row/entry and rejects accumulated overflow', () => {
    expect(getResultError(parseKleLayout('[["A",{"y":false}]]'))).toMatch(/row 1.*entry 2/iu);
    expect(parseKleLayout('[[{"x":1.7e308,"w":1.7e308},"A","B"]]')).toMatchObject({ ok: false });
  });

  it('accepts the exact key limit and rejects one extra or oversized text', () => {
    expect(parseKleLayout(JSON.stringify([Array.from({ length: 512 }, () => '')])).ok).toBe(true);
    expect(parseKleLayout(JSON.stringify([Array.from({ length: 513 }, () => '')])).ok).toBe(false);
    expect(parseKleLayout(' '.repeat(5 * 1024 * 1024 + 1)).ok).toBe(false);
  });

  it('advances empty rows and merges consecutive property objects', () => {
    const parsed = parseKleLayout('[[],[{"x":-2,"w":2},{"y":0.5},""]]');
    expect(parsed.ok).toBe(true);
    expect(getResultValue(parsed).geometries[0]).toMatchObject({ xU: -2, yU: 1.5, widthU: 2 });
  });

  it('catches file read failure and refuses oversized files before reading', async () => {
    const unreadable = { size: 1, text: () => Promise.reject(new Error('denied')) };
    expect(getResultError(await readKleFile(unreadable))).toMatch(/read/iu);
    const oversized = {
      size: 5 * 1024 * 1024 + 1,
      text: () => Promise.reject(new Error('must not read')),
    };
    expect(getResultError(await readKleFile(oversized))).toMatch(/5 MiB/u);
    expect(await readKleFile({ size: 7, text: () => Promise.resolve('[[""]]') })).toMatchObject({
      ok: true,
    });
  });
});
