import { existsSync } from 'node:fs';

export function changedCheckPlan(files, exists = existsSync, mode = 'static') {
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
  const asset = files.some((file) => file.startsWith('src/') && !/\.[jt]sx?$/u.test(file));
  const unit = code.filter((file) => /^(?:src\/|tests\/unit\/)/u.test(file));
  return {
    code,
    static: mode === 'static',
    fullUnit: mode === 'unit' && (broad || asset),
    fullLint,
    related: mode === 'unit' ? unit : [],
    browser: [],
    tooling:
      mode === 'unit' &&
      files.some((file) => /^(?:scripts\/|tests\/tooling\/|\.github\/|\.githooks\/)/u.test(file)),
    reasons: [
      mode === 'unit'
        ? 'Unit-only staged check; E2E and static checks are separate.'
        : 'Static-only staged check; unit and E2E tests are separate.',
    ],
  };
}

export function describeCheckPlan(plan) {
  return {
    static: plan.static ? 'Whole-project types/architecture; changed-file lint/format' : false,
    unit: plan.fullUnit ? 'all' : plan.related,
    browser: plan.browser,
    tooling: plan.tooling,
    reasons: plan.reasons,
  };
}
