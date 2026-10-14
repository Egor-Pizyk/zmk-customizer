import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

export function runCommand(command, args, { cwd, timeout, inherit = false }) {
  const result = spawnSync(command, args, {
    cwd,
    timeout,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return result;
}

export function withSourceMutation(file, { anchor, replacement, unique = false }, run) {
  const original = readFileSync(file);
  const needle = Buffer.from(anchor);
  const start = original.indexOf(needle);
  if (start === -1) throw new Error(`Mutation anchor missing: ${file}`);
  if (unique && original.indexOf(needle, start + needle.length) !== -1) {
    throw new Error(`${file}: anchor must occur exactly once`);
  }
  const changed = Buffer.concat([
    original.subarray(0, start),
    Buffer.from(replacement),
    original.subarray(start + needle.length),
  ]);
  try {
    writeFileSync(file, changed);
    return run();
  } finally {
    restoreSource(file, changed, original);
  }
}

function restoreSource(file, changed, original) {
  if (!readFileSync(file).equals(changed)) {
    throw new Error(`File changed during test run; refusing to overwrite ${file}`);
  }
  writeFileSync(file, original);
  if (!readFileSync(file).equals(original)) {
    throw new Error(`${file}: original bytes were not restored`);
  }
}
