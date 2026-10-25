import { expect, it } from 'vitest';
import { getMarqueeSelection, getSelectedKeyIds } from '@ui/schematic/interaction';
import { buildProject, freeEnd } from '../../../../helpers/build-project';

const project = buildProject({
  keys: [
    { id: 'k0', xU: 1, yU: 1 },
    { id: 'k1', xU: 8, yU: 8 },
  ],
  wires: [
    { id: 'w1', start: freeEnd(0, 3), end: freeEnd(6, 3), bends: [] },
    { id: 'w2', start: freeEnd(0, 5), end: freeEnd(6, 9), bends: [] },
  ],
});
it('selects a passing segment even with both endpoints outside, without touching project', () => {
  const selection = getMarqueeSelection(project, {
    marquee: { start: { xU: 2, yU: 2 }, end: { xU: 4, yU: 4 } },
    selection: undefined,
    additive: false,
  });
  expect(selection).toEqual({ kind: 'sections', base: project, sectionIds: ['w1:0:0'] });
});
it('does not select empty space inside an L path bounding box', () => {
  expect(
    getMarqueeSelection(project, {
      marquee: { start: { xU: 2, yU: 6 }, end: { xU: 4, yU: 8 } },
      selection: undefined,
      additive: false,
    }),
  ).toBeUndefined();
});
it('normalizes reverse drags, selects intersected keys and unions Shift sets without duplicates', () => {
  const selection = getMarqueeSelection(project, {
    marquee: { start: { xU: 4, yU: 4 }, end: { xU: 1.5, yU: 1.5 } },
    selection: { kind: 'multi', keyIds: ['k1'], wireIds: [] },
    additive: true,
  });
  expect(selection).toEqual({
    kind: 'sections',
    base: project,
    sectionIds: ['w1:0:0'],
    keyIds: ['k1', 'k0'],
  });
  const repeated = getMarqueeSelection(project, {
    marquee: { start: { xU: 1.5, yU: 1.5 }, end: { xU: 4, yU: 4 } },
    selection,
    additive: true,
  });
  expect(repeated).toEqual(selection);
});
it('includes a segment that touches a marquee edge but excludes a merely edge-touching key', () => {
  expect(
    getMarqueeSelection(project, {
      marquee: { start: { xU: 2, yU: 2 }, end: { xU: 4, yU: 3 } },
      selection: undefined,
      additive: false,
    }),
  ).toEqual({ kind: 'sections', base: project, sectionIds: ['w1:0:0'] });
});
it('does not union stale project-scoped refs or hidden encoder push keys', () => {
  const next = {
    ...project,
    encoders: [
      {
        id: 'e0',
        xU: 1,
        yU: 1,
        half: 'left' as const,
        aPin: 0,
        bPin: 1,
        steps: 20,
        triggersPerRotation: 20,
        pushKeyId: 'k0',
      },
    ],
  };
  expect(
    getMarqueeSelection(next, {
      marquee: { start: { xU: 0, yU: 0 }, end: { xU: 2, yU: 2 } },
      selection: { kind: 'sections', base: project, sectionIds: ['w1:0:0'], keyIds: ['k1'] },
      additive: true,
    }),
  ).toBeUndefined();
});

it('selects only the intersected side of a connected crossing', () => {
  const crossing = {
    ...project,
    wires: [
      { id: 'w1', start: freeEnd(0, 3), end: freeEnd(6, 3), bends: [] },
      { id: 'w2', start: freeEnd(2, 2), end: freeEnd(2, 4), bends: [] },
    ],
  };
  expect(
    getMarqueeSelection(crossing, {
      marquee: { start: { xU: 0.5, yU: 2.75 }, end: { xU: 1.5, yU: 3.25 } },
      selection: undefined,
      additive: false,
    }),
  ).toEqual({ kind: 'sections', base: crossing, sectionIds: ['w1:0:0'] });
});

it('ignores stale mixed keys in layout and keyboard selection queries', () => {
  const selection = {
    kind: 'sections' as const,
    base: project,
    keyIds: ['k0'],
    sectionIds: ['w1:0:0'],
  };
  expect(getSelectedKeyIds(selection, { project })).toEqual(['k0']);
  expect(getSelectedKeyIds(selection, { project: { ...project } })).toEqual([]);
});
