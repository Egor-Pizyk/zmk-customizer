"""Verify behavioral tests detect seeded regressions; restore uncommitted bytes exactly."""
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
MUTATIONS = [['cross-family pin retention',
  'src/domain/change-controller.ts',
  'previous.family === next.family && next.gpioPins.includes(end.boardPin)',
  'next.gpioPins.includes(end.boardPin)',
  ['src/ui/app.test.ts']],
 ['lost same-family pin retention',
  'src/domain/change-controller.ts',
  'previous.family === next.family && next.gpioPins.includes(end.boardPin)',
  'false',
  ['src/domain/change-controller.test.ts']],
 ['deleted key keeps layer bindings',
  'src/domain/remove-key.ts',
  'keyId !== input.keyId',
  'true',
  ['src/ui/app.test.ts']],
 ['undo restores current state',
  'src/ui/project-history.ts',
  'present: previous,',
  'present: history.present,',
  ['src/ui/project-history.test.ts']],
 ['new edit retains redo history',
  'src/ui/project-history.ts',
  'present, future: []',
  'present, future: history.future',
  ['src/ui/project-history.test.ts']],
 ['keymap shifts layer target',
  'src/generators/render-binding.ts',
  'layer.id === binding.layerId)}',
  'layer.id === binding.layerId) + 1}',
  ['src/generators/generate-shield-files.test.ts']],
 ['export ignores validation',
  'src/ui/export/get-export-preview.ts',
  'issues.length === 0 && matrix.ok',
  'matrix.ok',
  ['src/ui/export/get-export-preview.test.ts']],
 ['controller select loses change handler',
  'src/ui/schematic/controller-panel.tsx',
  'onChange={handleChange}',
  'onChange={() => {}}',
  ['src/ui/app.test.ts']],
 ['reverse diode button loses handler',
  'src/ui/schematic/diode-controls.tsx',
  'onClick={handleReverse}',
  'onClick={() => {}}',
  ['src/ui/app.test.ts']],
 ['explicit shield name ignored',
  'src/domain/get-shield-name.ts',
  'project.shieldName ?? toShieldName(project.name)',
  'toShieldName(project.name)',
  ['src/domain/get-shield-name.test.ts']]]

MUTATIONS += [
 ['backup discard leaves damaged bytes', 'src/storage/project-storage.ts', 'localStorage.removeItem(PROJECT_BACKUP_STORAGE_KEY);', '', ['src/ui/app-storage.test.tsx']],
 ['imprecise entity IDs', 'src/domain/create-entity-id.ts', 'BigInt(suffix)', 'BigInt(Number(suffix))', ['src/domain/create-entity-id.test.ts', 'src/storage/project-file.test.ts']],
 ['stale imports replace newest request', 'src/ui/import-session.ts', "return 'superseded';", "return 'current';", ['src/ui/app-project-files.test.ts']],
 ['import overwrites edited project', 'src/ui/import-session.ts', "token.revision === revision ? 'current' : 'changed'", "'current'", ['src/ui/app-project-files.test.ts']],
 ['empty move destroys redo', 'src/domain/move-keys.ts', '? project', '? { ...project }', ['src/ui/project-noops.test.ts']],
 ['identical bends creates a new project', 'src/domain/set-wire-bends.ts', '? project', '? { ...project }', ['src/domain/set-wire-bends.test.ts']],
 ['geometry argument stack overflow', 'src/domain/find-key-layout-center.ts', 'return {', 'Math.max(...project.keys.map(key => key.xU)); return {', ['src/domain/find-key-layout-center.test.ts']],
 ['oversized wire bends accepted', 'src/storage/project-schema.ts', '.max(PROJECT_BUDGET.bendsPerWire)', '', ['src/storage/project-budget.test.ts']],
 ['invalid project mislabeled as unavailable', 'src/storage/project-storage.ts', "error: { kind: 'invalid-project', reason: serialized.error }", "error: { kind: 'storage-unavailable' }", ['src/ui/app-storage.test.tsx']],
 ['incompatible draft accepts hold key', 'src/ui/bindings/pick-value.ts', "draft.behaviorId !== 'mt'", "false", ['src/ui/bindings/pick-slot.test.ts']],
]

MUTATIONS += [
 ['layout rotation reversed', 'src/domain/rotate-point.ts', '(input.rotationDeg * Math.PI)', '(-input.rotationDeg * Math.PI)', ['src/domain/get-key-pin-position.test.ts']],
 ['layout export loses width', 'src/generators/generate-overlay.ts', 'geometry.widthU,', '1,', ['src/generators/layout-export.test.ts']],
 ['duplicate loses layer bindings', 'src/domain/duplicate-keys.ts', 'bindings[copy.id] = binding;', '', ['src/domain/duplicate-keys.test.ts']],
 ['geometry no-op destroys redo', 'src/domain/set-key-geometries.ts', '? project', '? { ...project }', ['src/ui/layout-noops.test.ts']],
]

MUTATIONS += [
 ['pointer resize loses fixed anchor', 'src/domain/resize-key-from-pointer.ts', 'input.direction.x === -1 ? geometry.widthU - widthU : 0', '0', ['src/domain/resize-key-from-pointer.test.ts']],
 ['pointer rotation loses center pivot', 'src/domain/rotate-key-from-pointer.ts', 'rotationOriginXU: center.xU', 'rotationOriginXU: 0', ['src/domain/rotate-key-from-pointer.test.ts']],
 ['pointer release accepts overlap', 'src/domain/transform-key-from-pointer.ts', "input.phase === 'commit'", 'false', ['src/domain/transform-key-from-pointer.test.ts', 'src/ui/app-key-transforms.test.ts']],
 ['cancelled numeric geometry resurfaces', 'src/ui/schematic/layout-controls.tsx', 'props.hasPreview &&', '', ['src/ui/app-key-transforms.test.ts']],
 ['numeric editing loses live preview', 'src/ui/schematic/layout-controls.tsx', 'props.onPreview(next);', '', ['src/ui/app-key-transforms.test.ts']],
]

def run_mutation(mutation, report_path):
    label, relative, before, after, tests = mutation
    path = ROOT / relative
    original = path.read_bytes()
    anchor = before.encode()
    if anchor not in original:
        raise RuntimeError(f"Mutation anchor missing: {label}")
    mutated = original.replace(anchor, after.encode(), 1)
    report_path.unlink(missing_ok=True)
    try:
        path.write_bytes(mutated)
        result = subprocess.run(
            ["docker", "compose", "run", "--rm", "app", "npm", "exec", "--", "vitest", "run",
             *tests, "--reporter=json", f"--outputFile={report_path.relative_to(ROOT)}"],
            cwd=ROOT, capture_output=True, text=True, timeout=120,
        )
    finally:
        if path.read_bytes() != mutated:
            raise RuntimeError(f"File changed during test run; refusing to overwrite {relative}")
        path.write_bytes(original)
    report = json.loads(report_path.read_text())
    failures = [test for suite in report["testResults"] for test in suite["assertionResults"]
                if test["status"] == "failed"]
    if result.returncode == 0 or not failures:
        raise RuntimeError(f"Regression not detected by assertions: {label}\n{result.stdout}\n{result.stderr}")
    print(f"Detected: {label} ({len(failures)} failing tests)", flush=True)


def main():
    # A mounted temporary directory lets Docker write its report; nothing is committed.
    with tempfile.TemporaryDirectory(prefix=".test-mutations-", dir=ROOT) as temporary:
        for mutation in MUTATIONS:
            run_mutation(mutation, Path(temporary) / "result.json")
    print(f"Detected {len(MUTATIONS)}/{len(MUTATIONS)} seeded regressions; original files restored.")


if __name__ == "__main__":
    main()
