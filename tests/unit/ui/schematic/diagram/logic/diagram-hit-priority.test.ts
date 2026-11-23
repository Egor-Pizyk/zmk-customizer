// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { normalizeDiagramPointerInput } from '@ui/schematic/diagram/logic';
import { buildProject, freeEnd } from '../../../../../helpers/build-project';
import { getDefinedValue } from '../../../../../helpers/defined-value';

it.each(['pin', 'wire-end'])(
  'preserves higher %s priority beneath native corner overlays',
  (kind) => {
    const project = buildProject({
      keys: [{ id: 'k1', xU: 0, yU: 0 }],
      wires: [{ id: 'w1', start: freeEnd(0, 0), end: freeEnd(2, 2), bends: [{ xU: 1, yU: 1 }] }],
    });
    const host = document.createElement('div');
    host.innerHTML =
      '<svg><g data-wire-bend="" data-wire-id="w1" data-bend-x-u="1" data-bend-y-u="1"><rect /></g><g data-key-id="k1" data-pin="1"><circle /></g><g data-wire-id="w1" data-wire-end="end"><circle /></g></svg>';
    const corner = getDefinedValue(host.querySelector('rect'));
    const underlying = getDefinedValue(host.querySelector(`[data-${kind}] circle`));
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([corner, underlying]);
    const event = {
      target: corner,
      currentTarget: host,
      pointerId: 1,
      timeStamp: 0,
      clientX: 12,
      clientY: 12,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      preventDefault: vi.fn<() => void>(),
    };
    const normalized = normalizeDiagramPointerInput({ project, world: { xU: 1, yU: 1 }, event });
    expect(normalized.hit.kind).toBe(kind);
  },
);
