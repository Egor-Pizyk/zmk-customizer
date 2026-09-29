import { expect, it, vi } from 'vitest';
import { MAX_PROJECT_FILE_BYTES, readImportFile } from './read-import-file';

it('reads a valid project file', async () => {
  const file = new File(['{"schemaVersion":1,"name":"Corne"}'], 'corne.json');
  await expect(readImportFile(file)).resolves.toEqual({
    ok: true,
    value: {
      schemaVersion: 3,
      name: 'Corne',
      keys: [],
      wires: [],
      insulatedCrossings: [],
      layers: [{ id: 'l0', name: 'Base', bindings: {} }],
    },
  });
});

it('refuses a file over 5 MB without reading it', async () => {
  const file = new File(['x'.repeat(MAX_PROJECT_FILE_BYTES + 1)], 'big.json');
  const text = vi.spyOn(file, 'text');
  await expect(readImportFile(file)).resolves.toEqual({ ok: false, error: { kind: 'too-large' } });
  expect(text).not.toHaveBeenCalled();
});

it('reports text that is not JSON', async () => {
  await expect(readImportFile(new File(['hello'], 'hello.txt'))).resolves.toEqual({
    ok: false,
    error: { kind: 'not-json' },
  });
});
