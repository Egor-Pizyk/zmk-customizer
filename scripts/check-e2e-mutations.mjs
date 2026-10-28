import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runCommand, withSourceMutation } from './mutation-runner.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const EVIDENCE = path.join(ROOT, '.e2e-mutations');
export const SEEDS = [
  [
    'disabled-rotation',
    'src/ui/schematic/interaction/use-key-transform-pointer.ts',
    "options.activeToolId === 'select' ? readTransformTarget(event.target, world) : undefined",
    "options.activeToolId === 'select' && options.project.keys.length === -1 ? readTransformTarget(event.target, world) : undefined",
    'rotate outside bottom right',
    'toBeLessThan',
  ],
  [
    'invisible-preview',
    'src/ui/schematic/diagram/logic/project-diagram-keys.ts',
    "'fill-surface-raised stroke-border-strong",
    "'opacity-0 fill-surface-raised stroke-border-strong",
    'switch sizing unavailable.*light',
    'toHaveCSS',
  ],
  [
    'shifted-hit-area',
    'src/ui/schematic/rendering/components/key-transform-frames.tsx',
    'className="group flex size-full',
    'className="translate-x-10 [&>span]:-translate-x-10 group flex size-full',
    'switch sizing unavailable.*light',
    'toBeCloseTo',
  ],
  [
    'lost-save',
    'src/ui/project/logic/project-state.ts',
    'const saved = saveProject(project);',
    'const saved = project.keys.some(key => key.rotationDeg !== undefined) ? { ok: true as const } : saveProject(project);',
    'rotate outside bottom right',
    'toMatchObject',
  ],
  [
    'extra-undo',
    'src/ui/project/logic/project-history.ts',
    'past: [...history.past, history.present].slice(-UNDO_LIMIT)',
    'past: [...history.past, history.present, present].slice(-UNDO_LIMIT)',
    'rotate outside bottom right',
    'toEqual',
  ],
  [
    'cancelled-value',
    'src/ui/schematic/layout/components/layout-controls.tsx',
    'props.hasPreview && draft?.base === project',
    'draft?.base === project',
    'precise numeric Enter shows',
    'toHaveValue',
  ],
  [
    'lost-wiring-route',
    'src/domain/wiring/editing/edit-wiring.ts',
    'connections: connections.filter((connection) => terminalIds.includes(connection.terminalId)),',
    'connections: [],',
    'matrix preview, conflict repair',
    'toBeVisible',
  ],
  [
    'saved-wiring-preview',
    'src/ui/schematic/wiring/logic/use-wiring-preview.ts',
    'setDraft(getDraftResult(project, { result, source, input }));',
    'const nextDraft = getDraftResult(project, { result, source, input }); if (nextDraft) { commit(() => nextDraft.preview); } setDraft(nextDraft && { ...nextDraft, base: nextDraft.preview });',
    'matrix preview, conflict repair',
    'toEqual',
  ],
  [
    'wrong-split-offset',
    'src/generators/shield/generate-split-overlays.ts',
    'col-offset = <${matrix.halves.left.colPins.length}>;',
    'col-offset = <0>;',
    'BLE split uses separate',
    'toContain',
  ],
];

export function getBrowserFailures(suites) {
  return suites.flatMap((suite) => [
    ...getBrowserFailures(suite.suites ?? []),
    ...(suite.specs ?? []).flatMap((spec) =>
      spec.tests.flatMap((test) =>
        test.results
          .filter((result) => result.status === 'failed')
          .flatMap((result) => result.errors ?? []),
      ),
    ),
  ]);
}

export function assertBrowserDetection(report, status, name, assertion) {
  const messages = getBrowserFailures(report.suites ?? []).map((error) => error.message ?? '');
  if (
    status === 0 ||
    !messages.some((message) => message.includes(assertion) && message.includes('expect'))
  ) {
    throw new Error(
      `${name}: no expected behavioral assertion failure: ${JSON.stringify(messages)}`,
    );
  }
  if (report.errors?.length) throw new Error(`${name}: runner failure is not regression evidence`);
}

export function checkSeed(seed) {
  const [name, relative, anchor, replacement, grep, assertion] = seed;
  const file = path.join(ROOT, relative);
  const reportDirectory = path.join(EVIDENCE, name);
  const reportPath = path.join(reportDirectory, 'report.json');
  return withSourceMutation(file, { anchor, replacement, unique: true }, () => {
    mkdirSync(reportDirectory, { recursive: true });
    rmSync(reportPath, { force: true });
    const result = runCommand(
      'docker',
      [
        'compose',
        '-p',
        'zmk-customizer',
        '-f',
        'infra/compose.e2e.yaml',
        'run',
        '--rm',
        '-e',
        `PLAYWRIGHT_JSON_OUTPUT_FILE=.e2e-mutations/${name}/report.json`,
        'e2e',
        'npx',
        'playwright',
        'test',
        '--project=chromium',
        '--grep',
        grep,
        '--reporter=json',
        `--output=.e2e-mutations/${name}/artifacts`,
      ],
      { cwd: ROOT },
    );
    writeFileSync(path.join(reportDirectory, 'runner.log'), result.stdout + result.stderr);
    if (!existsSync(reportPath))
      throw new Error(`${name}: no browser report; inspect ${reportDirectory}`);
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    assertBrowserDetection(report, result.status, name, assertion);
    process.stdout.write(`PASS ${name}: user assertion ${assertion} detected regression\n`);
    return { seed: name, assertion, detected: true };
  });
}

export function main() {
  mkdirSync(EVIDENCE, { recursive: true });
  const baseline = runCommand(
    'docker',
    [
      'compose',
      '-p',
      'zmk-customizer',
      '-f',
      'infra/compose.e2e.yaml',
      'run',
      '--rm',
      'e2e',
      'npx',
      'playwright',
      'test',
      '--project=chromium',
      '--grep',
      'rotate outside bottom right|switch sizing unavailable.*light|precise numeric Enter shows|matrix preview, conflict repair|BLE split uses separate',
    ],
    { cwd: ROOT, inherit: true },
  );
  if (baseline.status !== 0) throw new Error('Baseline browser suite failed before mutations');
  const results = SEEDS.map((seed) => checkSeed(seed));
  writeFileSync(path.join(EVIDENCE, 'summary.json'), JSON.stringify(results, null, 2) + '\n');
  process.stdout.write(
    `Detected ${SEEDS.length}/${SEEDS.length} regressions; exact original production bytes restored.\n`,
  );
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main();
