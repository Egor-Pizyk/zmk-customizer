// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { createProject } from '@domain/project';
import { placeEncoder } from '@domain/encoders';
import { ENCODER_DEFAULTS } from '@catalog/encoders';
import { getEncoderGeometry } from '@domain/geometry';
import {
  createShortcutHandlers,
  endSelectDrag,
  getPreviewProject,
  moveSelectDrag,
  readCanvasHit,
} from '@ui/schematic/interaction';
import type { Drag, PointerState } from '@ui/schematic/interaction';

function stateWithDrag(drag?: Drag): PointerState {
  const project = placeEncoder(createProject({ controllerId: 'nice_nano_v2' }), {
    position: { xU: 2, yU: 3 },
    defaults: ENCODER_DEFAULTS,
  });
  return {
    project,
    drag,
    activeToolId: 'select',
    snapGridU: 0.25,
    selection: undefined,
    draft: undefined,
    commit: vi.fn<PointerState['commit']>(),
    onHint: vi.fn<PointerState['onHint']>(),
    onHintClear: vi.fn<PointerState['onHintClear']>(),
    onSelectionChange: vi.fn<PointerState['onSelectionChange']>(),
    onDragChange: vi.fn<PointerState['onDragChange']>(),
    onDraftChange: vi.fn<PointerState['onDraftChange']>(),
  };
}
const drag: Drag = {
  kind: 'encoder',
  encoderId: 'e1',
  rotate: false,
  origin: { xU: 2.5, yU: 3.5 },
  bodyStart: { xU: 2, yU: 3 },
  angleStart: 0,
  angle: 0,
  position: { xU: 4, yU: 5 },
};

it('recognizes contacts before the body and the rotation handle before a body hit', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.innerHTML =
    '<g data-encoder-id="e1"><g data-encoder-id="e1" data-encoder-pin="COM"><circle /></g><circle data-encoder-rotate="e1" /></g>';
  expect(readCanvasHit(svg.querySelector('g g circle'))).toEqual({
    kind: 'encoder-pin',
    encoderId: 'e1',
    pin: 'COM',
  });
  expect(readCanvasHit(svg.querySelector('[data-encoder-rotate]'))).toEqual({
    kind: 'encoder',
    encoderId: 'e1',
    rotate: true,
  });
  expect(readCanvasHit(svg.querySelector('g'))).toEqual({
    kind: 'encoder',
    encoderId: 'e1',
    rotate: false,
  });
});
it('previews linked movement without saving and commits the same geometry once on release', () => {
  const state = stateWithDrag(drag);
  const preview = getPreviewProject(state.project, drag);
  expect(preview.keys[0]).toMatchObject({ xU: 4, yU: 5 });
  expect(state.project.keys[0]).toMatchObject({ xU: 2, yU: 3 });
  expect(getPreviewProject(state.project, stateWithDrag().drag)).toBe(state.project);
  endSelectDrag(state);
  expect(state.commit).toHaveBeenCalledTimes(1);
  const call = vi.mocked(state.commit).mock.calls[0];
  expect(call?.[0](state.project)).toEqual(preview);
});
it('rotates about the encoder center without translating its push key', () => {
  const rotation = {
    ...drag,
    rotate: true,
    position: drag.bodyStart,
    origin: { xU: 3.5, yU: 3.5 },
  };
  const state = stateWithDrag(rotation);
  moveSelectDrag(state, { xU: 2.5, yU: 4.5 });
  const next = vi.mocked(state.onDragChange).mock.calls[0]?.[0];
  expect(next).toMatchObject({ angle: 90, position: { xU: 2, yU: 3 } });
  const preview = getPreviewProject(state.project, next);
  expect(preview.encoders.map((encoder) => getEncoderGeometry(preview, encoder))).toEqual([
    { xU: 2, yU: 3, rotationDeg: 90 },
  ]);
});
it('places an encoder from Enter at the same free top-left cell as numeric placement', () => {
  const state = stateWithDrag();
  const handlers = createShortcutHandlers({
    project: state.project,
    commit: state.commit,
    selection: undefined,
    onSelectionChange: state.onSelectionChange,
    activeToolId: 'add-encoder',
    onToolChange: vi.fn<(toolId: PointerState['activeToolId']) => void>(),
    hasDraft: false,
    onDraftCancel: vi.fn<() => void>(),
  });
  handlers.onPlaceKey();
  const call = vi.mocked(state.commit).mock.calls[0];
  const next = call?.[0](state.project);
  expect(next?.encoders[1]).toMatchObject({ xU: 3, yU: 3, wiringMode: 'schematic' });
});
