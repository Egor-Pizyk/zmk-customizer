# Rotary encoders verification

2026-10-19. Work on branch `019-encoders`; existing uncommitted 014–018 work retained. No commit requested or created.

## SDD and review

Feature resolver explicitly selected `specs/019-encoders`. Spec, plan, contracts and requirement-linked tasks cover all eight requirements. Defaults and non-goals resolved without material questions. Spec quality checklist passes; no extension hooks configured. Spec-reviewer returned **ready to implement**, no findings. ZMK-reviewer returned **approve**, no findings, after checking pinned EC11 schemas, sensors C configuration order, sensor-rotate, Kconfig and Sofle. Its Docker generator run passed 4/4; this was not a firmware compilation claim.

## Targeted evidence

Tests were written before domain/storage/generator implementation. Initial suites failed on missing APIs/schema, then passed. Independent hardware/rotation/driver fragments were hand-authored from pinned Sofle and v0.3 schemas; no-encoder tests preserve full existing golden bytes. Storage tests cover v10→v11 exact content preservation, roundtrip, strict unknown fields, duplicate/oversized collections, dangling encoder map entries and repairable semantic conflicts. Existing historical migration suites continue to exercise earlier versions.

Rendered app tests exercise actual controls/providers, separate layer actions, history, deletion focus/cleanup and Export→Schematic repair. The first isolated Playwright pass covered Chromium, Firefox and WebKit: 4/4, 11.5 seconds. Saved/downloaded JSON, archive contents, reload, Escape draft cancellation, per-layer action independence and pin/deleted-target repair were asserted. Final repeated browser evidence is recorded below.

Additional regressions were observed red before fixes: encoder-only deleted-layer references no longer allow a new layer to reuse that ID; new encoder markers are placed separately instead of initially overlapping. Layer-domain tests passed 49/49 after the ID repair.

## Completion checks

- `make check` before the shared-memory repair: **1183/1183 tests in 203 files**, typecheck, E2E typecheck, architecture, guideline, tooling, lint and formatting gates passed. Coverage: **91.46% statements, 85.10% branches, 92.23% functions, 91.44% lines**; thresholds unchanged. Log: `/tmp/019-check-final-tree.log`.
- `make zmk-build`: **30/30 actual-export targets compiled**, plus intentional missing-connector rejection. Six new targets cover nice!nano and XIAO unibody, both split halves, and a right-only encoder with EC11/trigger symbols absent on the left. Local halves assert EC11 and GLOBAL_THREAD in the resulting `.config`. A subsequent final-limit fixture generation validated the project analysis and reproduced all **297 compiled export files byte-for-byte**, at that stage; the later shared-behavior change is compiled separately below. Logs/artifacts: `/tmp/019-zmk-build.log`, `.zmk-build/artifacts/`, `.zmk-build/logs/`.
- Full `make test-e2e` after runtime count limits: **139/139** Chromium plus focused Firefox/WebKit, **5.1 minutes**, no retries (`/tmp/019-e2e-verified.log`). Subsequent final-tree evidence after coordinate-limit extraction and shared-memory repair is recorded below.
- Earlier three sequential encoder baselines: **5/5 each**, 14.1s, 13.0s, 13.2s, without retries or intervening production edits; they include split dual-encoder export, native inputs, layer actions and runtime-count repair. Output is isolated under `.e2e-mutations/019-stable-{1,2,3}/`.
- Controlled regression, run alone: temporarily retain the old X coordinate in `replaceEncoder`. Chromium fails the user-facing number-field assertion (**7 expected / 6 actual**), proving sensitivity to a lost position edit. Exact original bytes restored in `finally`, SHA-256 `51b40a21c4804ff4ddf2eb7a12043ab49f8ae059f5764195ceeaf774e7aeabfd`. Reports/traces: `.e2e-mutations/019-position-regression/`, `/tmp/019-browser-sensitivity-result.log`.
- Inspected the isolated production screenshot at **1024×900**: canvas and encoder marker remain visible while editing the bounded, scrollable hardware panel. Browser asserts no horizontal document overflow; this is screenshot QA, not a manual screen-reader or complete responsive audit.
- Six Sofle reference files compare byte-for-byte with the pinned checkout; local feature-document links resolve; `git diff --check` passes.

Initial failed attempts remain distinct from final evidence: a full browser run lost a WebKit trace because two runners shared the output directory (137 behavioral cases passed; one runner-artifact failure). Subsequent runs use separate output folders and execute sequentially. The first split test targeted a non-focusable nested Wiring heading with Enter; it was corrected to target the actual summary, without changing product code or weakening assertions. A concurrent early check also observed the intentionally red marker-spacing test; the final check includes its repair.

Pinned C review additionally confirmed runtime hazards absent from DT YAML: >360 electrical steps enter the legacy fractional-tick branch, >360 triggers divide by zero, and non-divisors of 360 distort the rate. Domain tests first failed for these values, then passed with injected catalog limits; the browser rejects 7 triggers and repairs to 24. The reviewer confirmed these constraints and the documented minor upstream microdegree quantization.

| Scenario | Risk / existing coverage | New browser evidence | Visible and saved/exported assertions |
|---|---|---|---|
| Hardware edits and counts | Lost drafts/commits; shared native input tests | Hardware lifecycle; invalid trigger repair | X/step fields, marker, Escape and focused repair; exact JSON and overlay counts |
| Layer actions and dangling references | Retargeting; existing layer/reference tests | Distinct two-layer actions; deleted macro repair | Active controls and repair fieldset; saved maps and CW/CCW keymap order |
| Half pins and split export | GPIO sharing/cross-half activation; wiring tests | Same 20/21 pins on opposite halves; D2 conflict repair | Disabled export and focus; shared sensor order plus only local node enablement |
| Deletion and persistence | Loss of unrelated project state; generic history/storage tests | Delete, Undo, reload and real downloads | Marker removal/add focus; exact restored Project and downloaded JSON/ZIP |

Memory review and current-tree checks:

- Source-backed review identified avoidable RAM growth: one state matrix per duplicate rotation instance. The maximum-grid generator test was observed failing with 512 definitions, then passing with one definition and 512 ordered references. ZMK-reviewer approved deterministic pair interning, label rows and safe sensor/layer-specific shared state; its Docker generator run passed **5/5**.
- Final `make check` after sharing: **1184/1184 tests, 203 files**, all static/tooling/format gates passed. Coverage: **91.47% statements, 85.09% branches, 92.23% functions, 91.45% lines**. Log: `/tmp/019-check-delivery.log`.
- The fixture generator now validates and produces **32 targets**. The **234 files** belonging to 24 previously compiled non-encoder targets remain byte-identical (SHA-256 comparison). Recompiled all **8 current encoder targets** through the same pinned official runner using `.zmk-build/encoder-verification-exports/` as `/exports`, including the six normal cases and two new 12-encoder/32-layer stress halves. All eight and the intentional negative build passed (`/tmp/019-zmk-memory-build.log`). Thus all 32 current target inputs have compile evidence or exact equivalence to compiled inputs; this was a targeted final rerun, not a claim that the earlier full make command compiled 32.
- Stress RAM: **58,216 bytes left**, **32,956 bytes right**, out of 256 KiB each. Actual linked firmware artifacts and `.config`/DTS are in `.zmk-build/artifacts/encoders-memory-{left,right}/`.
- Final frozen-tree `make test-e2e`: **139/139 passed**, **5.2 minutes**, no retries, including the production build and Chromium plus focused Firefox/WebKit. Log: `/tmp/019-browser-delivery.log`. Then three sequential `npx playwright test tests/e2e/encoders.spec.ts` runs passed **5/5 each**, **13.3s, 12.3s, 11.6s**, with no intervening production/test changes or retries. Logs: `/tmp/019-browser-delivery-repeat-{1,2,3}.log`; isolated reports/screenshots/traces: `.e2e-mutations/019-delivery-{1,2,3}/`. All final verification commands exited 0.

## Limits

No manual mouse-unplugged accessibility pass, screen-reader speech/contrast audit, or physical encoder/keyboard test was performed. Automated native input/focus coverage does not establish those outcomes. Encoder push switches remain normal keys; only EC11 rotation sensors are supported. No onboarding update is needed: roadmap 032 has not been implemented.
