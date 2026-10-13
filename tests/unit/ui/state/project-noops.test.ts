import { afterEach, it, expect, vi } from 'vitest';
import { moveKeys, setWireBends, createProject } from '@domain';
import { applyHistoryAction, createInitialState } from '@ui/project';

const RENAME = {
  kind: 'commit',
  update: (project: ReturnType<typeof createProject>) => ({ ...project, name: 'B' }),
} as const;
function initial(status: { readonly kind: 'ok' }) {
  return createInitialState({ project: createProject({ controllerId: 'nice_nano_v2' }), status });
}
function stubSetItem(setItem: (key: string, value: string) => void) {
  vi.stubGlobal('localStorage', { setItem });
}
afterEach(() => {
  vi.unstubAllGlobals();
});

it('keeps redo and avoids autosave for empty move and unknown bends domain operations', () => {
  const setItem = vi.fn<(key: string, value: string) => void>();
  stubSetItem(setItem);
  const edited = applyHistoryAction(initial({ kind: 'ok' }), { action: RENAME });
  const undone = applyHistoryAction(edited, { action: { kind: 'undo' } });
  setItem.mockClear();
  const moved = applyHistoryAction(undone, {
    action: { kind: 'commit', update: (project) => moveKeys(project, { moves: [] }) },
  });
  const bent = applyHistoryAction(moved, {
    action: {
      kind: 'commit',
      update: (project) => setWireBends(project, { wireId: 'missing', bends: [] }),
    },
  });
  expect(bent).toBe(undone);
  expect(setItem).not.toHaveBeenCalled();
  expect(applyHistoryAction(bent, { action: { kind: 'redo' } }).history.present.name).toBe('B');
});
