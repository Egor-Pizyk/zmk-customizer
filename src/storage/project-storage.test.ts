import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../domain/create-project';
import {
  PROJECT_STORAGE_KEY,
  backupDamagedProject,
  discardBackup,
  loadProject,
  readStoredProjectText,
  saveProject,
} from './project-storage';
import { serializeProject } from './serialize-project';

const BACKUP_KEY = 'zmk-customizer:project-backup';

function storageStub(values: Record<string, string>, overrides: Partial<Storage> = {}): Storage {
  return {
    length: 0,
    clear: vi.fn<() => void>(),
    getItem: vi.fn<(key: string) => string | null>((key) => values[key] ?? null),
    key: vi.fn<(index: number) => string | null>(() => null),
    removeItem: vi.fn<(key: string) => void>(),
    setItem: vi.fn<(key: string, value: string) => void>(),
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadProject', () => {
  it('returns a new project with status missing when nothing is stored', () => {
    vi.stubGlobal('localStorage', storageStub({}));
    expect(loadProject()).toEqual({ project: createProject(), status: { kind: 'missing' } });
  });

  it('returns the stored project', () => {
    const project = { schemaVersion: 1, name: 'Corne' } as const;
    vi.stubGlobal(
      'localStorage',
      storageStub({ [PROJECT_STORAGE_KEY]: serializeProject(project) }),
    );
    expect(loadProject()).toEqual({ project, status: { kind: 'ok' } });
  });

  it('returns status unavailable when storage throws', () => {
    const getItem = vi.fn<(key: string) => string | null>(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.stubGlobal('localStorage', storageStub({}, { getItem }));
    expect(loadProject()).toEqual({ project: createProject(), status: { kind: 'unavailable' } });
  });

  it('never writes the main key and reports a kept backup', () => {
    const setItem = vi.fn<(key: string, value: string) => void>();
    const values = {
      [PROJECT_STORAGE_KEY]: serializeProject(createProject()),
      [BACKUP_KEY]: 'old',
    };
    vi.stubGlobal('localStorage', storageStub(values, { setItem }));
    expect(loadProject().backupText).toBe('old');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('has no backupText when no backup is kept', () => {
    vi.stubGlobal('localStorage', storageStub({}));
    expect('backupText' in loadProject()).toBe(false);
  });
});

describe('saveProject', () => {
  it('writes the serialized project to the main key', () => {
    const setItem = vi.fn<(key: string, value: string) => void>();
    vi.stubGlobal('localStorage', storageStub({}, { setItem }));
    expect(saveProject(createProject())).toEqual({ ok: true, value: undefined });
    expect(setItem).toHaveBeenCalledWith(PROJECT_STORAGE_KEY, serializeProject(createProject()));
  });

  it('reports quota-exceeded', () => {
    const setItem = vi.fn<(key: string, value: string) => void>(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    vi.stubGlobal('localStorage', storageStub({}, { setItem }));
    expect(saveProject(createProject())).toEqual({ ok: false, error: 'quota-exceeded' });
  });

  it('reports unavailable for any other failure', () => {
    const setItem = vi.fn<(key: string, value: string) => void>(() => {
      throw new Error('blocked');
    });
    vi.stubGlobal('localStorage', storageStub({}, { setItem }));
    expect(saveProject(createProject())).toEqual({ ok: false, error: 'unavailable' });
  });
});

function stubWith(
  values: Record<string, string>,
  setItem = vi.fn<(key: string, value: string) => void>(),
) {
  vi.stubGlobal('localStorage', storageStub(values, { setItem }));
  return setItem;
}

describe('loadProject with damaged stored data', () => {
  it('copies the raw value to the empty backup slot and never writes the main key', () => {
    const setItem = stubWith({ [PROJECT_STORAGE_KEY]: '{broken' });
    expect(loadProject()).toEqual({
      project: createProject(),
      status: { kind: 'damaged', reason: 'not-json', isBackupBlocked: false },
      backupText: '{broken',
    });
    expect(setItem).toHaveBeenCalledExactlyOnceWith(BACKUP_KEY, '{broken');
  });

  it('treats a backup holding the same value as free and writes nothing', () => {
    const setItem = stubWith({ [PROJECT_STORAGE_KEY]: '{broken', [BACKUP_KEY]: '{broken' });
    expect(loadProject().status).toEqual({
      kind: 'damaged',
      reason: 'not-json',
      isBackupBlocked: false,
    });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('blocks autosave when the backup slot holds a different value', () => {
    const setItem = stubWith({ [PROJECT_STORAGE_KEY]: '{broken', [BACKUP_KEY]: 'older' });
    const result = loadProject();
    expect(result.status).toEqual({ kind: 'damaged', reason: 'not-json', isBackupBlocked: true });
    expect(result.backupText).toBe('older');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('blocks autosave when the backup write fails', () => {
    const setItem = vi.fn<(key: string, value: string) => void>(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    stubWith({ [PROJECT_STORAGE_KEY]: '{broken' }, setItem);
    const result = loadProject();
    expect(result.status).toEqual({ kind: 'damaged', reason: 'not-json', isBackupBlocked: true });
    expect('backupText' in result).toBe(false);
  });

  it('reports a newer schemaVersion as damaged', () => {
    stubWith({ [PROJECT_STORAGE_KEY]: '{"schemaVersion":99}' });
    expect(loadProject().status).toMatchObject({ kind: 'damaged', reason: 'newer-version' });
  });

  it('reports a wrong shape as not-project', () => {
    stubWith({ [PROJECT_STORAGE_KEY]: '{"schemaVersion":1}' });
    expect(loadProject().status).toMatchObject({ kind: 'damaged', reason: 'not-project' });
  });
});

describe('backup helpers', () => {
  it('backupDamagedProject copies the main value into the empty slot', () => {
    const setItem = vi.fn<(key: string, value: string) => void>();
    vi.stubGlobal('localStorage', storageStub({ [PROJECT_STORAGE_KEY]: 'B{' }, { setItem }));
    expect(backupDamagedProject()).toEqual({ ok: true, value: 'B{' });
    expect(setItem).toHaveBeenCalledExactlyOnceWith(BACKUP_KEY, 'B{');
  });

  it('backupDamagedProject writes nothing when the slot is occupied', () => {
    const setItem = vi.fn<(key: string, value: string) => void>();
    const values = { [PROJECT_STORAGE_KEY]: 'B{', [BACKUP_KEY]: 'A' };
    vi.stubGlobal('localStorage', storageStub(values, { setItem }));
    expect(backupDamagedProject().ok).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('discardBackup removes the backup key', () => {
    const removeItem = vi.fn<(key: string) => void>();
    vi.stubGlobal('localStorage', storageStub({}, { removeItem }));
    expect(discardBackup()).toEqual({ ok: true, value: undefined });
    expect(removeItem).toHaveBeenCalledExactlyOnceWith(BACKUP_KEY);
  });

  it('readStoredProjectText returns the raw main value', () => {
    vi.stubGlobal('localStorage', storageStub({ [PROJECT_STORAGE_KEY]: 'raw' }));
    expect(readStoredProjectText()).toBe('raw');
  });
});
