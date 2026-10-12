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
  ': input.issues;',
  ': [];',
  ['src/ui/app.test.ts']],
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
