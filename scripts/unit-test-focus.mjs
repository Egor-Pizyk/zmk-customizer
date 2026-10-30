import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function unitFocusCommand(
  args,
  exists = existsSync,
  isDirectory = (file) => statSync(file).isDirectory(),
) {
  const files = [];
  let pattern;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '-t' || arg === '--test-name-pattern') {
      pattern = args[++index];
      if (!pattern || pattern.startsWith('-')) throw new Error('A test-name pattern is required.');
    } else if (
      exists(arg) &&
      !arg.split('/').includes('..') &&
      (/^tests\/(?:unit\/.*\.test\.tsx?|tooling\/.*\.test\.mjs)$/u.test(arg) ||
        (/^tests\/unit\/[^*?]+$/u.test(arg) && isDirectory(arg)))
    ) {
      files.push(arg);
    } else throw new Error(`Expected an existing unit/tooling test file, received: ${arg}`);
  }
  if (!files.length)
    throw new Error('Name an explicit test file; use test:unit for the full suite.');
  const tooling = files[0].startsWith('tests/tooling/');
  if (files.some((file) => file.startsWith('tests/tooling/') !== tooling))
    throw new Error('Diagnose application and tooling tests separately.');
  return tooling
    ? {
        command: process.execPath,
        args: ['--test', ...(pattern ? ['--test-name-pattern', pattern] : []), ...files],
      }
    : {
        command: 'npx',
        args: ['--no-install', 'vitest', 'run', ...files, ...(pattern ? ['-t', pattern] : [])],
      };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const command = unitFocusCommand(process.argv.slice(2));
    const result = spawnSync(command.command, command.args, { stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
