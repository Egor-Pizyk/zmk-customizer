import { strToU8, zipSync } from 'fflate';
import type { Zippable } from 'fflate';
import type { GeneratedFile } from '@generators';

export function buildExportZip(files: readonly GeneratedFile[]): Promise<Uint8Array<ArrayBuffer>> {
  const entries: Zippable = Object.fromEntries(
    files
      .toSorted((left, right) => (left.path < right.path ? -1 : 1))
      .map((file) => [file.path, strToU8(file.content)]),
  );
  return new Promise((resolve, reject) => {
    // Defer to show busy state; async fflate workers conflict with the app's strict CSP.
    setTimeout(() => {
      try {
        // ZIP DOS fields use local getters; an ISO UTC date varies by timezone.
        const bytes = zipSync(entries, {
          level: 6,
          mtime: new Date(1980, 0, 1, 0, 0, 0),
          os: 0,
          attrs: 0,
        });
        resolve(new Uint8Array(bytes));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Could not build ZIP'));
      }
    }, 0);
  });
}
