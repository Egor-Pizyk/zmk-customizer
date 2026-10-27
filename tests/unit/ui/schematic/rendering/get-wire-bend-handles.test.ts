import { getWireBendHandles } from '@ui/schematic/rendering/logic';
import { getWirePath } from '@domain/wires/geometry';
import { expect, it } from 'vitest';
import { buildProject, freeEnd } from '../../../../helpers/build-project';

it.each([
  {
    end: freeEnd(4, 0),
    bends: [
      { xU: 1, yU: 0 },
      { xU: 2, yU: 0 },
      { xU: 3, yU: 0 },
    ],
  },
  {
    end: freeEnd(0, 4),
    bends: [
      { xU: 0, yU: 1 },
      { xU: 0, yU: 2 },
      { xU: 0, yU: 3 },
    ],
  },
])('keeps one movable handle along a straight wire: $end.at', ({ end, bends }) => {
  const project = buildProject({ wires: [{ id: 'w1', start: freeEnd(0, 0), end, bends }] });
  const handles = getWireBendHandles(
    project,
    new Map(project.wires.map((wire) => [wire.id, getWirePath(project, wire)])),
  );
  expect(handles).toHaveLength(1);
  expect(handles[0]).toEqual({ wireId: 'w1', point: bends[0], bendIndex: 0 });
});

it('removes straight-line intermediary handles while preserving the real turns', () => {
  const project = buildProject({
    wires: [
      {
        id: 'w1',
        start: freeEnd(0, 0),
        end: freeEnd(4, 2),
        bends: [
          { xU: 1, yU: 0 },
          { xU: 2, yU: 0 },
          { xU: 2, yU: 1 },
          { xU: 2, yU: 2 },
          { xU: 3, yU: 2 },
        ],
      },
    ],
  });
  const handles = getWireBendHandles(
    project,
    new Map(project.wires.map((wire) => [wire.id, getWirePath(project, wire)])),
  );
  expect(handles.map((handle) => handle.point)).toEqual([
    { xU: 2, yU: 0 },
    { xU: 2, yU: 2 },
  ]);
});

it('exposes a derived corner without inventing a saved bend index', () => {
  const project = buildProject({
    wires: [{ id: 'w1', start: freeEnd(0, 0), end: freeEnd(4, 2), bends: [] }],
  });
  const paths = new Map(project.wires.map((wire) => [wire.id, getWirePath(project, wire)]));
  expect(getWireBendHandles(project, paths)).toEqual([
    { wireId: 'w1', point: { xU: 4, yU: 0 }, bendIndex: undefined },
  ]);
});

it('renders one semantic handle for repeated bends and a coincident corner on another wire', () => {
  const project = buildProject({
    wires: [
      {
        id: 'w1',
        start: freeEnd(0, 0),
        end: freeEnd(4, 2),
        bends: [
          { xU: 4, yU: 0 },
          { xU: 4, yU: 0 },
        ],
      },
      { id: 'w2', start: freeEnd(2, 0), end: freeEnd(4, 3), bends: [] },
    ],
  });
  const paths = new Map(project.wires.map((wire) => [wire.id, getWirePath(project, wire)]));
  expect(getWireBendHandles(project, paths)).toEqual([
    { wireId: 'w1', point: { xU: 4, yU: 0 }, bendIndex: 0 },
  ]);
});
