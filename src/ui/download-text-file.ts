import type { Result } from '../domain/types';

// Browser download via a temporary link (research R11); no File System Access API (Chromium only).
export function downloadTextFile(input: {
  readonly fileName: string;
  readonly text: string;
}): Result<void, 'blocked'> {
  try {
    const url = URL.createObjectURL(new Blob([input.text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = input.fileName;
    link.click();
    URL.revokeObjectURL(url);
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, error: 'blocked' };
  }
}
