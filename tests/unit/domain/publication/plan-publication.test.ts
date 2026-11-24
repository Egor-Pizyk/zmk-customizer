import { describe, expect, it } from 'vitest';
import { planPublication } from '@domain/publication';

const files = [
  { path: 'config/board.keymap', oid: 'new', content: 'new content' },
  { path: 'build.yaml', oid: 'same', content: 'unchanged' },
  { path: '.github/workflows/build.yml', oid: 'pinned', content: 'pinned workflow' },
];
const entries = [
  { path: 'config/board.keymap', sha: 'old', mode: '100644' },
  { path: 'build.yaml', sha: 'same', mode: '100644' },
  { path: '.github/workflows/build.yml', sha: 'custom', mode: '100644' },
  { path: 'README.md', sha: 'readme', mode: '100644' },
];

describe('planPublication', () => {
  it('reports replacements and preserves an existing workflow and unrelated paths', () => {
    expect(planPublication(files, entries, false)).toEqual({
      ok: true,
      value: [{ ...files[0], change: 'replace' }],
    });
  });

  it('includes a workflow replacement when explicitly requested', () => {
    expect(planPublication(files, entries, true)).toEqual({
      ok: true,
      value: [
        { ...files[0], change: 'replace' },
        { ...files[2], change: 'replace' },
      ],
    });
  });

  it('preserves workflows under alternate names and adds a workflow to a fresh repository', () => {
    const alternate = [{ path: '.github/workflows/custom.yaml', sha: 'other', mode: '100644' }];
    expect(planPublication(files, alternate, false)).toEqual({
      ok: true,
      value: [
        expect.objectContaining({ path: 'config/board.keymap' }),
        expect.objectContaining({ path: 'build.yaml' }),
      ],
    });
    expect(planPublication(files, [], false)).toEqual({
      ok: true,
      value: files.map((file) => ({
        path: file.path,
        content: file.content,
        oid: file.oid,
        change: 'add',
      })),
    });
  });

  it('refuses to replace a symlink or write through a non-directory ancestor', () => {
    expect(
      planPublication(files, [{ path: 'config', sha: 'link', mode: '120000' }], false),
    ).toEqual({
      ok: false,
      error: 'config',
    });
    expect(
      planPublication(files, [{ path: 'build.yaml', sha: 'link', mode: '120000' }], false),
    ).toEqual({
      ok: false,
      error: 'build.yaml',
    });
  });
});
