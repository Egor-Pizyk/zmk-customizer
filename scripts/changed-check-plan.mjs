import { existsSync } from 'node:fs';

export function changedCheckPlan(files, exists = existsSync) {
  const code = files.filter((file) => /\.(?:[cm]?[jt]sx?)$/u.test(file) && exists(file));
  const fullLint = files.some((file) => /(?:oxlintrc|oxfmtrc)/u.test(file));
  const broad =
    fullLint ||
    files.some(
      (file) =>
        /^(?:package(?:-lock)?\.json|Makefile$|infra\/|\.github\/workflows\/|.*config.*|tests\/(?:fixtures|helpers)\/|src\/.*\/index\.ts$)/u.test(
          file,
        ) ||
        (!exists(file) && /^(?:src|tests)\//u.test(file)),
    );
  const source = files.some((file) => file.startsWith('src/'));
  const asset = files.some((file) => file.startsWith('src/') && !/\.[jt]sx?$/u.test(file));
  const unit = code.filter((file) => /^(?:src\/|tests\/unit\/)/u.test(file));
  const browser = files.filter((file) => /^tests\/e2e\/.*\.spec\.ts$/u.test(file) && exists(file));
  return {
    code,
    fullUnit: broad || asset,
    fullLint,
    related: unit,
    // Browser journeys use runtime UI interactions; static imports cannot establish impact.
    browser: broad || source || files.includes('tests/e2e/helpers.ts') ? ['tests/e2e'] : browser,
    tooling: files.some((file) =>
      /^(?:scripts\/|tests\/tooling\/|\.github\/|\.githooks\/)/u.test(file),
    ),
  };
}
