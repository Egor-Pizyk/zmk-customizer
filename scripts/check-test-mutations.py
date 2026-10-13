"""Verify behavioral tests detect seeded regressions; restore uncommitted bytes exactly."""
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
MUTATIONS = [['cross-family pin retention',
  'src/domain/project/change-controller.ts',
  'previous.family === next.family && next.gpioPins.includes(end.boardPin)',
  'next.gpioPins.includes(end.boardPin)',
  ['tests/unit/ui/integration/app.test.ts']],
 ['lost same-family pin retention',
  'src/domain/project/change-controller.ts',
  'previous.family === next.family && next.gpioPins.includes(end.boardPin)',
  'false',
  ['tests/unit/domain/project/change-controller.test.ts']],
 ['deleted key keeps layer bindings',
  'src/domain/keys/remove-key.ts',
  'keyId !== input.keyId',
  'true',
  ['tests/unit/ui/integration/app.test.ts']],
 ['undo restores current state',
  'src/ui/project/project-history.ts',
  'present: previous,',
  'present: history.present,',
  ['tests/unit/ui/project/project-history.test.ts']],
 ['new edit retains redo history',
  'src/ui/project/project-history.ts',
  'present, future: []',
  'present, future: history.future',
  ['tests/unit/ui/project/project-history.test.ts']],
 ['keymap shifts layer target',
  'src/generators/keymap/render-binding.ts',
  'layer.id === binding.layerId)}',
  'layer.id === binding.layerId) + 1}',
  ['tests/unit/generators/shield/generate-shield-files.test.ts']],
 ['export ignores validation',
  'src/ui/export/get-export-preview.ts',
  'issues.length === 0 && matrix.ok',
  'matrix.ok',
  ['tests/unit/ui/export/get-export-preview.test.ts']],
 ['controller select loses change handler',
  'src/ui/schematic/wiring/controller-panel.tsx',
  'onChange={handleChange}',
  'onChange={() => {}}',
  ['tests/unit/ui/integration/app.test.ts']],
 ['reverse diode button loses handler',
  'src/ui/schematic/parts/diode-controls.tsx',
  'onClick={handleReverse}',
  'onClick={() => {}}',
  ['tests/unit/ui/integration/app.test.ts']],
 ['explicit shield name ignored',
  'src/domain/project/get-shield-name.ts',
  'project.shieldName ?? toShieldName(project.name)',
  'toShieldName(project.name)',
  ['tests/unit/domain/project/get-shield-name.test.ts']]]

MUTATIONS += [
 ['backup discard leaves damaged bytes', 'src/storage/project/project-storage.ts', 'localStorage.removeItem(PROJECT_BACKUP_STORAGE_KEY);', '', ['tests/unit/ui/integration/app-storage.test.tsx']],
 ['imprecise entity IDs', 'src/domain/project/create-entity-id.ts', 'BigInt(suffix)', 'BigInt(Number(suffix))', ['tests/unit/domain/project/create-entity-id.test.ts', 'tests/unit/storage/project/project-file.test.ts']],
 ['stale imports replace newest request', 'src/ui/project/import-session.ts', "return 'superseded';", "return 'current';", ['tests/unit/ui/integration/app-project-files.test.ts']],
 ['import overwrites edited project', 'src/ui/project/import-session.ts', "token.revision === revision ? 'current' : 'changed'", "'current'", ['tests/unit/ui/integration/app-project-files.test.ts']],
 ['empty move destroys redo', 'src/domain/keys/move-keys.ts', '? project', '? { ...project }', ['tests/unit/ui/state/project-noops.test.ts']],
 ['identical bends creates a new project', 'src/domain/wires/set-wire-bends.ts', '? project', '? { ...project }', ['tests/unit/domain/wires/set-wire-bends.test.ts']],
 ['geometry argument stack overflow', 'src/domain/geometry/find-key-layout-center.ts', 'return {', 'Math.max(...project.keys.map(key => key.xU)); return {', ['tests/unit/domain/geometry/find-key-layout-center.test.ts']],
 ['oversized wire bends accepted', 'src/storage/project/project-schema.ts', '.max(PROJECT_BUDGET.bendsPerWire)', '', ['tests/unit/storage/project/project-budget.test.ts']],
 ['invalid project mislabeled as unavailable', 'src/storage/project/project-storage.ts', "error: { kind: 'invalid-project', reason: serialized.error }", "error: { kind: 'storage-unavailable' }", ['tests/unit/ui/integration/app-storage.test.tsx']],
 ['incompatible draft accepts hold key', 'src/ui/bindings/picker/pick-value.ts', "draft.behaviorId !== 'mt'", "false", ['tests/unit/ui/bindings/picker/pick-slot.test.ts']],
]

MUTATIONS += [
 ['layout rotation reversed', 'src/domain/geometry/rotate-point.ts', '(input.rotationDeg * Math.PI)', '(-input.rotationDeg * Math.PI)', ['tests/unit/domain/wires/get-key-pin-position.test.ts']],
 ['layout export loses width', 'src/generators/shield/generate-overlay.ts', 'geometry.widthU,', '1,', ['tests/unit/generators/shield/layout-export.test.ts']],
 ['duplicate loses layer bindings', 'src/domain/keys/duplicate-keys.ts', 'bindings[copy.id] = binding;', '', ['tests/unit/domain/keys/duplicate-keys.test.ts']],
 ['geometry no-op destroys redo', 'src/domain/keys/set-key-geometries.ts', '? project', '? { ...project }', ['tests/unit/ui/state/layout-noops.test.ts']],
]

MUTATIONS += [
 ['pointer resize loses fixed anchor', 'src/domain/geometry/resize-key-from-pointer.ts', 'input.direction.x === -1 ? geometry.widthU - widthU : 0', '0', ['tests/unit/domain/geometry/resize-key-from-pointer.test.ts']],
 ['pointer rotation loses center pivot', 'src/domain/geometry/rotate-key-from-pointer.ts', 'rotationOriginXU: center.xU', 'rotationOriginXU: 0', ['tests/unit/domain/geometry/rotate-key-from-pointer.test.ts']],
 ['pointer release accepts overlap', 'src/domain/geometry/transform-key-from-pointer.ts', "input.phase === 'commit'", 'false', ['tests/unit/domain/geometry/transform-key-from-pointer.test.ts', 'tests/unit/ui/integration/app-key-transforms.test.ts']],
 ['cancelled numeric geometry resurfaces', 'src/ui/schematic/layout/layout-controls.tsx', 'props.hasPreview &&', '', ['tests/unit/ui/integration/app-key-transforms.test.ts']],
 ['numeric editing loses live preview', 'src/ui/schematic/layout/layout-controls.tsx', 'props.onPreview(next);', '', ['tests/unit/ui/integration/app-key-transforms.test.ts']],
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
