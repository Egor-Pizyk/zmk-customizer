import { expect, it } from 'vitest';
import { formatProjectFileError } from '@ui/shell/logic';

it.each([
  ['not-json', 'This file is not a ZMK Customizer project file and could not be read.'],
  ['newer-version', 'This file was made by a newer version of ZMK Customizer.'],
  ['too-large', 'This project exceeds the 5 MiB file or saved-data limit.'],
] as const)('%s', (kind, title) => {
  expect(formatProjectFileError({ kind })).toEqual({ title, lines: [] });
});

it('lists at most 10 issues and counts the rest', () => {
  const issues = Array.from({ length: 12 }, (_, index) => ({
    path: `keys.${index}`,
    message: 'Expected a number',
  }));
  const formatted = formatProjectFileError({ kind: 'not-project', issues });
  expect(formatted.title).toBe('This file is not a valid project file:');
  expect(formatted.lines).toHaveLength(11);
  expect(formatted.lines[0]).toBe('keys.0: Expected a number');
  expect(formatted.lines[10]).toBe('…and 2 more');
});

it('names the root when an issue has no path', () => {
  const formatted = formatProjectFileError({
    kind: 'not-project',
    issues: [{ path: '', message: 'Expected an object' }],
  });
  expect(formatted.lines).toEqual(['(file): Expected an object']);
});
