import { SHIELD_TARGET } from '@catalog/firmware';
import { createProject } from '@domain/project';
import type { Project, Result } from '@domain';
import { parseProjectFile } from './parse-project-file';
import type { ProjectFileError } from './parse-project-file';
import { serializeProject } from './serialize-project';

export const PROJECT_STORAGE_KEY = 'zmk-customizer:project';
export const PROJECT_BACKUP_STORAGE_KEY = 'zmk-customizer:project-backup';

export type StorageError = 'unavailable' | 'quota-exceeded';

export type SaveError =
  | { readonly kind: 'invalid-project'; readonly reason: string }
  | { readonly kind: 'storage-unavailable' }
  | { readonly kind: 'quota-exceeded' };

export type DamageReason = 'not-json' | 'not-project' | 'newer-version';

export type ProjectLoadStatus =
  | { readonly kind: 'ok' }
  | { readonly kind: 'missing' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'damaged'; readonly reason: DamageReason; readonly isBackupBlocked: boolean };

export type ProjectLoadResult = {
  readonly project: Project;
  readonly status: ProjectLoadStatus;
  /** Value of the backup key after loading; the provider never reads storage (research R7). */
  readonly backupText?: string;
};

function toStorageError(error: unknown): StorageError {
  return error instanceof DOMException && error.name === 'QuotaExceededError'
    ? 'quota-exceeded'
    : 'unavailable';
}

function readItem(key: string): Result<string | undefined, StorageError> {
  try {
    return { ok: true, value: localStorage.getItem(key) ?? undefined };
  } catch (error) {
    return { ok: false, error: toStorageError(error) };
  }
}

function writeItem(key: string, value: string): Result<void, StorageError> {
  try {
    localStorage.setItem(key, value);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toStorageError(error) };
  }
}

function withBackupText(
  result: ProjectLoadResult,
  backupText: string | undefined,
): ProjectLoadResult {
  return backupText === undefined ? result : { ...result, backupText };
}

function withBackup(result: ProjectLoadResult): ProjectLoadResult {
  const backup = readItem(PROJECT_BACKUP_STORAGE_KEY);
  return withBackupText(result, backup.ok ? backup.value : undefined);
}

// Copies the damaged raw value aside before anything may overwrite the main key. A slot holding
// the same value counts as free, so a repeated load changes nothing (research R7).
function copyToBackup(raw: string): { readonly isCopied: boolean; readonly backupText?: string } {
  const backup = readItem(PROJECT_BACKUP_STORAGE_KEY);
  if (!backup.ok) {
    return { isCopied: false };
  }
  if (backup.value === raw) {
    return { isCopied: true, backupText: raw };
  }
  if (backup.value !== undefined) {
    return { isCopied: false, backupText: backup.value };
  }
  return writeItem(PROJECT_BACKUP_STORAGE_KEY, raw).ok
    ? { isCopied: true, backupText: raw }
    : { isCopied: false };
}

function toDamageReason(error: ProjectFileError): DamageReason {
  return error.kind === 'too-large' ? 'not-project' : error.kind;
}

// Called once before the first render (research R7); never writes the main key.
export function loadProject(): ProjectLoadResult {
  const stored = readItem(PROJECT_STORAGE_KEY);
  if (!stored.ok) {
    return {
      project: createProject({ controllerId: SHIELD_TARGET.boardId }),
      status: { kind: 'unavailable' },
    };
  }
  if (stored.value === undefined) {
    return withBackup({
      project: createProject({ controllerId: SHIELD_TARGET.boardId }),
      status: { kind: 'missing' },
    });
  }
  const parsed = parseProjectFile(stored.value);
  if (parsed.ok) {
    return withBackup({ project: parsed.value, status: { kind: 'ok' } });
  }
  const copy = copyToBackup(stored.value);
  const reason = toDamageReason(parsed.error);
  const status = { kind: 'damaged', reason, isBackupBlocked: !copy.isCopied } as const;
  return withBackupText(
    { project: createProject({ controllerId: SHIELD_TARGET.boardId }), status },
    copy.backupText,
  );
}

/** After a discard while blocked: moves the untouched damaged main value into the empty slot. */
export function backupDamagedProject(): Result<string, StorageError> {
  const stored = readItem(PROJECT_STORAGE_KEY);
  if (!stored.ok) {
    return stored;
  }
  const backup = readItem(PROJECT_BACKUP_STORAGE_KEY);
  if (!backup.ok) {
    return backup;
  }
  if (stored.value === undefined || backup.value !== undefined) {
    return { ok: false, error: 'unavailable' };
  }
  const written = writeItem(PROJECT_BACKUP_STORAGE_KEY, stored.value);
  return written.ok ? { ok: true, value: stored.value } : written;
}

export function discardBackup(): Result<void, StorageError> {
  try {
    localStorage.removeItem(PROJECT_BACKUP_STORAGE_KEY);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toStorageError(error) };
  }
}

/** Raw stored text for the error boundary's "Download saved project" (observability.md). */
export function readStoredProjectText(): string | undefined {
  const stored = readItem(PROJECT_STORAGE_KEY);
  return stored.ok ? stored.value : undefined;
}

export function saveProject(project: Project): Result<void, SaveError> {
  const serialized = serializeProject(project);
  if (!serialized.ok) {
    return { ok: false, error: { kind: 'invalid-project', reason: serialized.error } };
  }
  const written = writeItem(PROJECT_STORAGE_KEY, serialized.value);
  return written.ok
    ? written
    : {
        ok: false,
        error: { kind: written.error === 'unavailable' ? 'storage-unavailable' : 'quota-exceeded' },
      };
}
