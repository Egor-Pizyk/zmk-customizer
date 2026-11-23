import { expect, it } from 'vitest';
import { findSymmetricRoute } from '@domain/wiring/editing';
import type { RoutingSegment } from '@domain/wiring/editing';
import { getResultValue } from '../../../../helpers/result';

const INPUT = {
  points: [
    { xU: 0, yU: 0 },
    { xU: 0, yU: 2 },
  ],
  half: 'left',
  netId: 'column',
  outward: 'left',
  clearanceU: 0.1,
  offsetU: 0.15,
} as const;
const parallel: RoutingSegment = {
  id: 'locked',
  half: 'left',
  netId: 'other',
  from: { xU: 0.05, yU: 0.5 },
  to: { xU: 0.05, yU: 1.5 },
};

it('keeps the preferred path when valid and returns explicit insulation for foreign crossings', () => {
  const result = getResultValue(
    findSymmetricRoute({
      ...INPUT,
      obstacles: [
        {
          id: 'row',
          half: 'left',
          netId: 'row',
          from: { xU: -1, yU: 1 },
          to: { xU: 1, yU: 1 },
        },
      ],
    }),
  );
  expect(result.points).toEqual(INPUT.points);
  expect(result.insulatedCrossings).toEqual([{ segmentId: 'row', at: { xU: 0, yU: 1 } }]);
  expect(result.strategy).toBe('preferred');
});

it('uses the first outward shift satisfying parallel clearance without modifying a fixed obstacle', () => {
  const before = JSON.stringify(parallel);
  const result = getResultValue(findSymmetricRoute({ ...INPUT, obstacles: [parallel] }));
  expect(result.points).toEqual([
    { xU: 0, yU: 0 },
    { xU: -0.15, yU: 0 },
    { xU: -0.15, yU: 2 },
    { xU: 0, yU: 2 },
  ]);
  expect(result.strategy).toBe('outward');
  expect(JSON.stringify(parallel)).toBe(before);
});

it('mirrors outward choices around an explicitly chosen axis', () => {
  const mirrored = getResultValue(
    findSymmetricRoute({
      ...INPUT,
      half: 'right',
      outward: 'right',
      points: [
        { xU: 6, yU: 0 },
        { xU: 6, yU: 2 },
      ],
      obstacles: [
        { ...parallel, half: 'right', from: { xU: 5.95, yU: 0.5 }, to: { xU: 5.95, yU: 1.5 } },
      ],
    }),
  );
  expect(mirrored.points).toEqual([
    { xU: 6, yU: 0 },
    { xU: 6.15, yU: 0 },
    { xU: 6.15, yU: 2 },
    { xU: 6, yU: 2 },
  ]);
});

it('ignores other-half geometry and repeats the same deterministic route', () => {
  const input = { ...INPUT, obstacles: [{ ...parallel, half: 'right' as const }] };
  expect(getResultValue(findSymmetricRoute(input)).points).toEqual(INPUT.points);
  expect(findSymmetricRoute(input)).toEqual(findSymmetricRoute(input));
});

it('refuses an obstacle at a fixed endpoint after the bounded candidate search', () => {
  const result = findSymmetricRoute({
    ...INPUT,
    obstacles: [],
    forbiddenPoints: [{ xU: 0, yU: 0 }],
  });
  expect(result).toEqual({
    ok: false,
    error: {
      code: 'route-impossible',
      message: 'No route satisfies the fixed contacts and clearance.',
      attempts: { preferred: 1, outward: 64, detour: 128 },
      blockingIds: ['pin:0'],
    },
  });
});

it('rejects invalid geometry and never reduces clearance to accept a route', () => {
  expect(findSymmetricRoute({ ...INPUT, clearanceU: 0, obstacles: [] }).ok).toBe(false);
  expect(
    findSymmetricRoute({
      ...INPUT,
      points: [
        { xU: 0, yU: 0 },
        { xU: 0, yU: 0 },
      ],
      obstacles: [],
    }).ok,
  ).toBe(false);
  expect(
    findSymmetricRoute({
      ...INPUT,
      points: [
        { xU: 0, yU: 0 },
        { xU: 1, yU: 1 },
      ],
      obstacles: [],
    }).ok,
  ).toBe(false);
});

it('tries detours only after exhausting 64 outward shifts and reports the deviation', () => {
  const obstacles = Array.from({ length: 65 }, (_, index) => ({
    id: `barrier-${index}`,
    half: 'left' as const,
    netId: 'foreign',
    from: { xU: -index * 0.15, yU: 0.5 },
    to: { xU: -index * 0.15, yU: 1.5 },
  }));
  const result = getResultValue(findSymmetricRoute({ ...INPUT, obstacles }));
  expect(result.strategy).toBe('detour');
  expect(result.points).toEqual([
    { xU: 0, yU: 0 },
    { xU: 0.15, yU: 0 },
    { xU: 0.15, yU: 2 },
    { xU: 0, yU: 2 },
  ]);
});

it('accepts exact parallel clearance but rejects smaller gaps including near segment ends', () => {
  expect(
    getResultValue(
      findSymmetricRoute({
        ...INPUT,
        obstacles: [{ ...parallel, from: { xU: 0.1, yU: 0.5 }, to: { xU: 0.1, yU: 1.5 } }],
      }),
    ).strategy,
  ).toBe('preferred');
  expect(
    getResultValue(
      findSymmetricRoute({
        ...INPUT,
        obstacles: [{ ...parallel, from: { xU: 0.06, yU: 2.06 }, to: { xU: 0.06, yU: 3 } }],
      }),
    ).strategy,
  ).not.toBe('preferred');
});

it('normalizes crossing descriptors independently of obstacle ordering', () => {
  const obstacles = [
    {
      id: 'z',
      half: 'left' as const,
      netId: 'z',
      from: { xU: -1, yU: 0.5 },
      to: { xU: 1, yU: 1.5 },
    },
    {
      id: 'a',
      half: 'left' as const,
      netId: 'a',
      from: { xU: -1, yU: 0.5 },
      to: { xU: 1, yU: 0.5 },
    },
  ];
  expect(findSymmetricRoute({ ...INPUT, obstacles })).toEqual(
    findSymmetricRoute({
      ...INPUT,
      obstacles: obstacles.toReversed(),
    }),
  );
});
