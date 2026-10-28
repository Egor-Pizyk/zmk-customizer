import { afterEach, expect, it, vi } from 'vitest';
import { applyHistoryAction, createInitialState } from '@ui/project/logic';
import { createProject } from '@domain/project';
import { setWireLocked } from '@domain/wires/protection';
import { moveKey } from '@domain/keys';
import { buildLockedWiringProject } from '../../../helpers/symmetric-wiring-fixtures';

const initial = () =>
  createInitialState({ project: buildLockedWiringProject(), status: { kind: 'ok' } });
afterEach(() => vi.unstubAllGlobals());

it('refuses a raw bulk bypass before autosave/history and announces the guarding wire', () => {
  const setItem = vi.fn<(key: string, value: string) => void>();
  vi.stubGlobal('localStorage', { setItem });
  const base = initial();
  const after = applyHistoryAction(base, {
    action: { kind: 'commit', update: (project) => ({ ...project, wires: [] }) },
  });
  expect(after.history).toBe(base.history);
  expect(setItem).not.toHaveBeenCalled();
  expect(after.announcement?.text).toContain('w0');
});

it('rejects unlock-plus-change, while explicit unlock and normal undo/redo remain valid', () => {
  vi.stubGlobal('localStorage', { setItem: vi.fn<(key: string, value: string) => void>() });
  const base = initial();
  const bypass = applyHistoryAction(base, {
    action: {
      kind: 'commit',
      update: (project) => ({
        ...setWireLocked(project, { wireId: 'w0', isLocked: false }),
        name: 'Combined edit',
      }),
    },
  });
  expect(bypass.history).toBe(base.history);
  const unlocked = applyHistoryAction(base, {
    action: {
      kind: 'commit',
      update: (project) => setWireLocked(project, { wireId: 'w0', isLocked: false }),
    },
  });
  expect(unlocked.history.past).toHaveLength(1);
  const moved = applyHistoryAction(unlocked, {
    action: {
      kind: 'commit',
      update: (project) => moveKey(project, { keyId: 'k0', position: { xU: 0, yU: 1 } }),
    },
  });
  expect(moved.history.past).toHaveLength(2);
  const undone = applyHistoryAction(applyHistoryAction(moved, { action: { kind: 'undo' } }), {
    action: { kind: 'undo' },
  });
  expect(undone.history.present).toBe(base.history.present);
  const redone = applyHistoryAction(applyHistoryAction(undone, { action: { kind: 'redo' } }), {
    action: { kind: 'redo' },
  });
  expect(redone.history.present).toBe(moved.history.present);
});

it('keeps confirmed whole-project replace separate from guarded edits', () => {
  vi.stubGlobal('localStorage', { setItem: vi.fn<(key: string, value: string) => void>() });
  const base = initial();
  const next = createProject({ controllerId: 'nice_nano_v2' });
  const replaced = applyHistoryAction(base, { action: { kind: 'replace', project: next } });
  expect(replaced.history.present).toBe(next);
  expect(replaced.history.past).toEqual([]);
  expect(
    applyHistoryAction(base, { action: { kind: 'commit', update: (project) => project } }),
  ).toBe(base);
});
