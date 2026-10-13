"""Run nine real-browser regressions alone and restore exact original production bytes."""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
EVIDENCE = ROOT / '.e2e-mutations'
SEEDS = [
    ('disabled-resize', 'src/ui/schematic/interaction/use-key-transform-pointer.ts',
     "options.activeToolId === 'select' ? readTransformTarget(event.target, world) : undefined",
     "options.activeToolId === 'select' && options.project.keys.length === -1 ? readTransformTarget(event.target, world) : undefined", 'resize right at 0', 'toBeCloseTo'),
    ('invisible-preview', 'src/ui/schematic/rendering/key-art.tsx',
     'className="fill-surface-raised stroke-border-strong',
     'className="opacity-0 fill-surface-raised stroke-border-strong',
     'reviewed rotated selection frame', 'toHaveScreenshot'),
    ('shifted-hit-area', 'src/ui/schematic/rendering/key-transform-frames.tsx',
     'className={`group flex size-full',
     'className={`translate-x-10 [&>span]:-translate-x-10 group flex size-full',
     'handles remain aligned after zoom', 'toBeLessThan'),
    ('lost-save', 'src/ui/project/project-state.ts',
     'const saved = saveProject(project);',
     'const saved = project.keys.some(key => key.widthU !== undefined) ? { ok: true as const } : saveProject(project);',
     'resize right at 0', 'toBe'),
    ('extra-undo', 'src/ui/project/project-history.ts',
     'past: [...history.past, history.present].slice(-UNDO_LIMIT)',
     'past: [...history.past, history.present, present].slice(-UNDO_LIMIT)',
     'resize right at 0', 'toEqual'),
    ('cancelled-value', 'src/ui/schematic/layout/layout-controls.tsx',
     'props.hasPreview &&', '',
     'precise numeric Enter shows', 'toHaveValue'),
    ('lost-wiring-route', 'src/domain/wiring/edit-wiring.ts',
     'connections: connections.filter((connection) => terminalIds.includes(connection.terminalId)),',
     'connections: [],', 'matrix preview, conflict repair', 'toBeVisible'),
    ('saved-wiring-preview', 'src/ui/schematic/wiring/use-wiring-preview.ts',
     'setDraft(result.value === project ? undefined : { base: project, preview: result.value });',
     'commit(() => result.value); setDraft(result.value === project ? undefined : { base: project, preview: result.value });',
     'matrix preview, conflict repair', 'toEqual'),
    ('wrong-split-offset', 'src/generators/shield/generate-split-overlays.ts',
     'col-offset = <${matrix.halves.left.colPins.length}>;',
     'col-offset = <0>;', 'BLE split uses separate', 'toContain'),
]


def failures(suites):
    for suite in suites:
        yield from failures(suite.get('suites', []))
        for spec in suite.get('specs', []):
            for test in spec.get('tests', []):
                for result in test.get('results', []):
                    if result.get('status') == 'failed':
                        yield from result.get('errors', [])


def check_seed(seed):
    name, relative, anchor, replacement, grep, assertion = seed
    path = ROOT / relative
    original = path.read_bytes()
    if original.count(anchor.encode()) != 1:
        raise RuntimeError(f'{name}: anchor must occur exactly once')
    changed = original.replace(anchor.encode(), replacement.encode(), 1)
    report_dir = EVIDENCE / name
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / 'report.json'
    report_path.unlink(missing_ok=True)
    try:
        path.write_bytes(changed)
        result = subprocess.run([
            'docker', 'compose', '-f', 'compose.e2e.yaml', 'run', '--rm',
            '-e', f'PLAYWRIGHT_JSON_OUTPUT_FILE=.e2e-mutations/{name}/report.json',
            'e2e', 'npx', 'playwright', 'test', '--project=chromium', '--grep', grep,
            '--reporter=json', f'--output=.e2e-mutations/{name}/artifacts',
        ], cwd=ROOT, capture_output=True, text=True)
        (report_dir / 'runner.log').write_text(result.stdout + result.stderr)
        if not report_path.exists():
            raise RuntimeError(f'{name}: no browser report; inspect {report_dir}')
        report = json.loads(report_path.read_text())
        errors = list(failures(report.get('suites', [])))
        messages = [error.get('message', '') for error in errors]
        if result.returncode == 0 or not any(assertion in message and 'expect' in message for message in messages):
            raise RuntimeError(f'{name}: no expected behavioral assertion failure: {messages}')
        if report.get('errors'):
            raise RuntimeError(f'{name}: runner failure is not regression evidence')
        print(f'PASS {name}: user assertion {assertion} detected regression', flush=True)
        return {'seed': name, 'assertion': assertion, 'detected': True}
    finally:
        if path.read_bytes() != changed:
            raise RuntimeError(f'{name}: concurrent edit detected; refusing to overwrite {path}')
        path.write_bytes(original)
        if path.read_bytes() != original:
            raise RuntimeError(f'{name}: original bytes were not restored')


if __name__ == '__main__':
    EVIDENCE.mkdir(exist_ok=True)
    # Baseline must pass before any source mutation, with reviewed snapshots already present.
    subprocess.run(['docker', 'compose', '-f', 'compose.e2e.yaml', 'run', '--rm',
                    'e2e', 'npx', 'playwright', 'test', '--project=chromium', '--grep',
                    'resize right at 0|reviewed rotated selection frame|handles remain aligned after zoom|precise numeric Enter shows|matrix preview, conflict repair|BLE split uses separate'],
                   cwd=ROOT, check=True)
    results = [check_seed(seed) for seed in SEEDS]
    (EVIDENCE / 'summary.json').write_text(json.dumps(results, indent=2) + '\n')
    print('Detected 9/9 regressions; exact original production bytes restored.')
