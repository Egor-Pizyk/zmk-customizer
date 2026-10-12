import { afterEach, expect, it, vi } from 'vitest';
import { downloadBlob } from './download-blob';
import { downloadTextFile } from './download-text-file';

const click = vi.fn<() => void>();
const remove = vi.fn<() => void>();
const append = vi.fn<() => void>();
const createObjectURL = vi.fn<(blob: Blob | MediaSource) => string>(() => 'blob:export');
const revokeObjectURL = vi.fn<(url: string) => void>();
function prepare() {
  vi.useFakeTimers();
  const link = { href: '', download: '', click, remove };
  vi.stubGlobal('document', { createElement: () => link, body: { append } });
  vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURL);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURL);
  return link;
}
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it('downloads attached link and defers URL cleanup until browser can consume it', () => {
  const link = prepare();
  const blob = new Blob(['hello']);
  expect(downloadBlob({ fileName: 'hello.txt', blob }).ok).toBe(true);
  expect(link.download).toBe('hello.txt');
  expect(link.href).toBe('blob:export');
  expect(append).toHaveBeenCalledWith(link);
  expect(click).toHaveBeenCalledOnce();
  expect(remove).toHaveBeenCalledOnce();
  expect(revokeObjectURL).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
});
it('cleans up and returns blocked when browser click fails', () => {
  prepare();
  click.mockImplementationOnce(() => {
    throw new Error('blocked');
  });
  expect(downloadBlob({ fileName: 'hello.zip', blob: new Blob() })).toEqual({
    ok: false,
    error: 'blocked',
  });
  expect(remove).toHaveBeenCalledOnce();
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
});
it('handles URL creation failure without attempting cleanup of a missing resource', () => {
  prepare();
  createObjectURL.mockImplementationOnce(() => {
    throw new Error('blocked');
  });
  expect(downloadBlob({ fileName: 'hello.zip', blob: new Blob() }).ok).toBe(false);
  expect(revokeObjectURL).not.toHaveBeenCalled();
});
it('preserves JSON default and exact Unicode plain text downloads', async () => {
  prepare();
  downloadTextFile({ fileName: 'project.json', text: '{"name":"Клавиатура"}\n' });
  const json = getBlob(0);
  expect(json.type).toBe('application/json');
  expect(await json.text()).toBe('{"name":"Клавиатура"}\n');
  downloadTextFile({
    fileName: 'keys.keymap',
    text: 'Привет\n',
    mimeType: 'text/plain;charset=utf-8',
  });
  const text = getBlob(1);
  expect(text.type).toBe('text/plain;charset=utf-8');
  expect(await text.text()).toBe('Привет\n');
});

function getBlob(index: number): Blob {
  const blob = createObjectURL.mock.calls[index]?.[0];
  if (!(blob instanceof Blob)) {
    throw new Error('Missing download Blob');
  }
  return blob;
}
