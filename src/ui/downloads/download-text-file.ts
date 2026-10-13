import type { Result } from '@domain';
import { downloadBlob } from './download-blob';

export function downloadTextFile(input: {
  readonly fileName: string;
  readonly text: string;
  readonly mimeType?: string;
}): Result<void, 'blocked'> {
  return downloadBlob({
    fileName: input.fileName,
    blob: new Blob([input.text], { type: input.mimeType ?? 'application/json' }),
  });
}
