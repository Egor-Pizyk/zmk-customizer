import { endSelectDrag } from '@ui/schematic/interaction';
import type { PointerState } from '@ui/schematic/interaction';
import { createProject } from '@domain/project';
import type { Project } from '@domain';
import { serializeProject } from '@storage/project';
import { expect, it, vi } from 'vitest';

function projectAtByteLimit(): Project {
  const project: Project = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    keys: Array.from({ length: 512 }, (_, index) => ({ id: `k${index}`, xU: index, yU: 0 })),
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
        end: { kind: 'free', at: { xU: 2, yU: 2 } },
        bends: [{ xU: 1, yU: 1 }],
      },
    ],
    layers: Array.from({ length: 64 }, (_, index) => ({
      id: `l${index}`,
      name: 'Base',
      bindings: Object.fromEntries(
        Array.from({ length: 512 }, (_entry, keyIndex) => [
          `k${keyIndex}`,
          { kind: 'kp' as const, key: { keycode: 'A', modifiers: [] } },
        ]),
      ),
    })),
  };
  let remaining = 5 * 1024 * 1024 - new TextEncoder().encode(`${JSON.stringify(project)}\n`).length;
  return {
    ...project,
    layers: project.layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      bindings: Object.fromEntries(
        Object.entries(layer.bindings).map(([keyId]) => {
          const padding = Math.min(4095, remaining);
          remaining -= padding;
          return [
            keyId,
            { kind: 'kp' as const, key: { keycode: 'A'.repeat(1 + padding), modifiers: [] } },
          ];
        }),
      ),
    })),
  };
}

it('explains a byte-budget bend drag refusal without dispatching a history change', () => {
  const project = projectAtByteLimit();
  expect(serializeProject(project).ok).toBe(true);
  const onHint = vi.fn<(text: string) => void>();
  const commit = vi.fn<PointerState['commit']>();
  endSelectDrag({
    project,
    activeToolId: 'select',
    snapGridU: undefined,
    selection: undefined,
    commit,
    onHint,
    onHintClear: vi.fn<PointerState['onHintClear']>(),
    onSelectionChange: vi.fn<PointerState['onSelectionChange']>(),
    onDragChange: vi.fn<PointerState['onDragChange']>(),
    draft: undefined,
    onDraftChange: vi.fn<PointerState['onDraftChange']>(),
    drag: { kind: 'bend', wireId: 'w1', bendIndex: 0, point: { xU: 123_456_789, yU: 1 } },
  });
  expect(onHint).toHaveBeenCalledWith(expect.stringContaining('byte budget'));
  expect(commit).not.toHaveBeenCalled();
  expect(serializeProject(project).ok).toBe(true);
});
