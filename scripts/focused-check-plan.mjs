import { existsSync } from 'node:fs';
import { changedCheckPlan } from './changed-check-plan.mjs';

const GUARDS = [
  'accessibility',
  'product',
  'onboarding-accessibility',
  'onboarding-keyboard',
  'onboarding-lifecycle',
];
const AREAS = [
  {
    pattern:
      /^src\/ui\/schematic\/(?:(?:parts|layout|encoders)\/|components\/(?:schematic-workspace|schematic-editor-panel|schematic-preview-bar)\.|interaction\/focus-after-delete\.)/u,
    reason:
      'Parts/layout/encoders: include keyboard, onboarding, project/import and nested issue-repair journeys.',
    tests: [
      'parts-groups',
      'encoders',
      'encoder-schematic',
      'schematic-panels',
      'key-clipboard',
      'layout-data',
      'layout-paint',
      'numeric-rotation',
      'switch-size',
      'wire-marquee',
      'crossing-sections',
      'kle-import',
    ],
  },
  {
    pattern: /^src\/ui\/(?:project\/|shell\/components\/(?:project-|preset-|kle-import))/u,
    reason:
      'Project creation/import: include modal, history, presets, KLE and onboarding lifecycle.',
    tests: [
      'project-creation',
      'presets',
      'kle-import',
      'agent-package',
      'agent-action-prominence',
      'onboarding-macropad',
    ],
  },
  {
    pattern: /^src\/ui\/onboarding\//u,
    reason:
      'Onboarding: include keyboard/focus, lifecycle, complete learning project and return paths.',
    tests: ['onboarding-macropad'],
  },
];

// Diagnostic hints only. Final changedCheckPlan intentionally keeps all Chromium journeys.
export function focusedCheckPlan(files, exists = existsSync) {
  const plan = changedCheckPlan(files, exists);
  const reasons = new Set();
  const selected = new Set(
    files.filter((file) => /^tests\/e2e\/.*\.spec\.ts$/u.test(file) && exists(file)),
  );
  const fallback = (reason) => ({ ...plan, browser: ['tests/e2e'], reasons: [reason] });
  for (const file of files) {
    if (
      /^(?:package(?:-lock)?\.json$|Makefile$|infra\/|\.github\/|.*config.*|.*oxlintrc.*|.*oxfmtrc.*|tests\/helpers\/|tests\/fixtures\/)/u.test(
        file,
      ) ||
      (file.startsWith('tests/e2e/') && !file.endsWith('.spec.ts')) ||
      (/^(?:src|tests)\//u.test(file) && !exists(file))
    ) {
      return fallback(
        `Global/shared/deleted input requires conservative full browser selection: ${file}`,
      );
    }
    if (!file.startsWith('src/')) continue;
    const area = AREAS.find((entry) => entry.pattern.test(file));
    if (!area) return fallback(`Unknown runtime area requires full browser selection: ${file}`);
    reasons.add(area.reason);
    const candidates = [...GUARDS, ...area.tests]
      .map((name) => `tests/e2e/${name}.spec.ts`)
      .filter(exists);
    if (!candidates.length)
      return fallback(`No mapped journeys exist for ${file}; use all browser tests.`);
    for (const candidate of candidates) selected.add(candidate);
  }
  if (!reasons.size)
    reasons.add(
      'No mapped production changes; retain directly changed tests and normal static/tooling selection.',
    );
  return { ...plan, browser: [...selected].toSorted(), reasons: [...reasons] };
}
