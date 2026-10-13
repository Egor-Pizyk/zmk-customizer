import type { Result } from '@domain';

export function downloadBlob(input: {
  readonly fileName: string;
  readonly blob: Blob;
}): Result<void, 'blocked'> {
  let url: string | undefined;
  let link: HTMLAnchorElement | undefined;
  try {
    url = URL.createObjectURL(input.blob);
    link = document.createElement('a');
    link.href = url;
    link.download = input.fileName;
    document.body.append(link);
    link.click();
    // Give the browser a task to consume the URL before releasing its backing bytes.
    const downloadUrl = url;
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 0);
    return { ok: true, value: undefined };
  } catch {
    if (url !== undefined) {
      URL.revokeObjectURL(url);
    }
    return { ok: false, error: 'blocked' };
  } finally {
    link?.remove();
  }
}
