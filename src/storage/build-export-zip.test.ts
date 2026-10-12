import { strFromU8, unzipSync } from 'fflate';
import { afterEach, expect, it, vi } from 'vitest';
import { buildUnibodyProject } from '../../tests/helpers/build-unibody-project';
import { getResultValue } from '../../tests/helpers/result';
import { SHIELD_TARGET } from '../catalog/shield-target';
import { deriveShieldMatrix } from '../domain/derive-shield-matrix';
import { generateRepositoryFiles } from '../generators/generate-repository-files';
import { buildExportZip } from './build-export-zip';

function files(includeWorkflow: boolean) {
  const project = buildUnibodyProject();
  return generateRepositoryFiles(project, {
    matrix: getResultValue(deriveShieldMatrix(project, SHIELD_TARGET)),
    target: SHIELD_TARGET,
    includeWorkflow,
  });
}
afterEach(() => vi.useRealTimers());
it.each([true, false])(
  'extracts every repository path and exact UTF-8 content (workflow %s)',
  async (includeWorkflow) => {
    const input = [...files(includeWorkflow), { path: 'unicode.txt', content: 'Клавиатура é\n' }];
    const bytes = await buildExportZip(input);
    const extracted = unzipSync(bytes);
    expect(Object.keys(extracted)).toEqual(input.map((file) => file.path).toSorted());
    for (const file of input) {
      const content = extracted[file.path];
      expect(decodeContent(content)).toBe(file.content);
    }
    expect(bytes.buffer).toBeInstanceOf(ArrayBuffer);
  },
);
it('is byte-identical across input order and wall-clock dates without modifying files', async () => {
  const input = files(true);
  const before = structuredClone(input);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2025-01-01T13:14:15Z'));
  const first = await buildExportZip(input);
  vi.setSystemTime(new Date('2030-05-02T07:08:09Z'));
  const second = await buildExportZip(input.toReversed());
  expect(second).toEqual(first);
  expect(input).toEqual(before);
});
it('records fixed DOS date/time, OS and attributes rather than environment metadata', async () => {
  const bytes = await buildExportZip([{ path: 'config/test.conf', content: '# Defaults\n' }]);
  const view = new DataView(bytes.buffer);
  expect(view.getUint32(0, true)).toBe(0x04_03_4b_50);
  expect(view.getUint16(10, true)).toBe(0);
  expect(view.getUint16(12, true)).toBe(33);
  const end = bytes.length - 22;
  const central = view.getUint32(end + 16, true);
  expect(view.getUint32(central, true)).toBe(0x02_01_4b_50);
  expect(view.getUint8(central + 5)).toBe(0);
  expect(view.getUint16(central + 12, true)).toBe(0);
  expect(view.getUint16(central + 14, true)).toBe(33);
  expect(view.getUint32(central + 38, true)).toBe(0);
});

function decodeContent(content: Uint8Array | undefined): string {
  if (content === undefined) {
    throw new Error('Missing ZIP entry');
  }
  return strFromU8(content);
}
