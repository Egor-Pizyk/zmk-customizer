import type { Result } from '@domain';
import { PROJECT_BUDGET } from '@domain/project';
import { parseKleLayout } from './parse-kle-layout';
import type { KleLayout } from './decode-kle-rows';

export async function readKleFile(
  file: Pick<File, 'size' | 'text'>,
): Promise<Result<KleLayout, string>> {
  if (file.size > PROJECT_BUDGET.bytes) {
    return { ok: false, error: 'The KLE file exceeds the 5 MiB limit.' };
  }
  const text = await readText(file);
  return text.ok ? parseKleLayout(text.value) : text;
}

async function readText(file: Pick<File, 'text'>): Promise<Result<string, string>> {
  try {
    return { ok: true, value: await file.text() };
  } catch {
    return { ok: false, error: 'Could not read the KLE file. Choose the file again to retry.' };
  }
}
