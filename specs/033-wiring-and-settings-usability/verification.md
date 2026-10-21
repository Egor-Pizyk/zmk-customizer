# Verification — feature 033

Date: 2026-10-20. Implementation is in the isolated `zmk-customizer-033` worktree on `feature/033-wiring-and-settings-usability`; unrelated changes in the original workspace are preserved. Feature 032 was accepted by the user and integrated from merge `21c5867` / release v0.1.0. That acceptance does not cover 033.

## Implemented contracts

- Completion preserves cells, existing wire identities/geometry and valid GPIOs; rebuild is explicit. Retained diode orientation and terminal order are respected; conflicts refuse and true no-ops preserve identity.
- Explicit intermediate contacts survive transforms through fixed spines and orthogonal leads. v11 validation precedes migration. Each migrated wire retains its own attachment references into a shared coordinate pool; deleting an equivalent branch cannot remove another wire's pin attachment. Key deletion tombstones pool entries without shifting references.
- Sections split at electrical boundaries, combine overlapping contributors, and retain ordinary bends/insulated crossings. Removal coalesces maximal surviving spans, preserves branches/GPIOs, and refuses stale refs/resource overflow atomically. Pointer and keyboard/list paths use the same operation.
- Bounded exclusive editors leave the specified canvas area visible, cancel hidden previews and restore focus. Settings uses its own compact native modal size.
- Saved JSON normally retains historical pretty formatting; near-limit files use deterministic compact whitespace with the same 5 MiB actual-byte guard. No data or budget is dropped.

## Regressions observed before fixes

Actual assertion failures were observed for intermediate-pin loss/incidental attachment, migration version, section query/deletion, missing additive completion, raw GPIO self-reservation, divergent internal overlaps, drawing to section hits, retained diode pin, split terminal no-op order, off-spine bend edits and dense/near-byte legacy migration. Further review reproduced redundant-branch provenance loss and unnecessary fragment budget exhaustion; both were replaced with pooled per-wire provenance and maximal surviving spans.

Focused final representation checks: `/tmp/zmk-033-pool-green.log` passed 26 query/removal/migration/storage cases. Shared-reference rejection and key-removal round trips are included in the final full run. Logs under `/tmp` are local temporary evidence, not CI artifacts.

## Automated verification

- Final full isolated Playwright: **173/173 passed**, Chromium plus focused Firefox/WebKit, zero retries (`/tmp/zmk-033-delivery-e2e.log`, 7.7 minutes). Includes actual JSON/ZIP pin/cell assertions and existing paint/geometry goldens.
- Final production build passed (`/tmp/zmk-033-delivery-build.log`).
- An initial combined coverage/browser run hit the existing 15-second unit limit under CPU contention. The maximal 5 MiB migration/round-trip scenario now has its own 60-second allowance; existing ordinary test limits are unchanged. Full checks are rerun alone after all browser runners stop. Earlier passing revisions are not substituted for this final check.
- Final `make check` passed in isolation: **217 files, 1278 tests**, with all architecture/guideline/tooling/type/lint/format checks and coverage floors (`/tmp/zmk-033-final-check-pass.log`). Domain coverage: 98.33% lines / 98.65% functions / 93.80% branches; storage: 97.70% / 100% / 93.20%; UI: 86.93% / 88.54% / 77.82%.

Firmware: `make zmk-build` passed all actual-export targets and intentional connector rejection (`/tmp/zmk-033-zmk2.log`), pinned ZMK v0.3.0 / Zephyr 3.5.0. The fixture generator's geometry import was updated after query ownership moved. Later pool changes preserve electrical/export semantics; final application and independent output suites check the shared representation. A redundant fresh local firmware repeat regenerated all 32 actual-export fixtures and passed its first controller targets before being stopped; it is not claimed as a second complete build. The earlier complete pinned build remains the local firmware evidence; protected CI must compile the final PR revision before merge.

Controlled sensitivity: the contact-loss, broadened deletion and panel-height seeds each failed an intended saved-data/geometry assertion, with exact original-byte restoration. The final representation rerun passed all three probes in isolation after the full browser runner stopped: `/tmp/zmk-033-sensitivity-final.log`; each probe logged the intended behavioral failure and exact-byte restoration.

## Rendered review

Used local ui-ux-pro-max before UI edits and after implementation. Targeted `focus not obscured` guidance retained visible focus, independently scrolling regions and focus return; existing tokens/density remain. Chromium light/dark screenshots were inspected. The rotated 200×200 selection-frame crop changed by about one CSS pixel after canvas resizing; expected/actual/diff were inspected and only the Linux Chromium reference was regenerated. Independent corner/anchor assertions remain unchanged. Final isolated Chromium screenshots of the migrated three-key fixture were inspected at 390, 768 and 1280 px in both themes; local images are under ignored `.zmk-build/review-033/`. Panel scrolling/focus remain available and no new horizontal page overflow was found. Viewport changes preserve the existing canvas pan; Center keyboard remains the navigation action. DOM budgets are covered by the repeated journeys.

## Remaining manual acceptance

T031 is unperformed for 033: actual keyboard/VoiceOver with Safari, OS theme/reduced-motion changes and physical 200% browser zoom. Isolated Playwright covers native browser interactions and effective layout sizes; it does not establish screen-reader speech or actual manual OS/zoom acceptance. `docs/testing.md`, this feature's quickstart and `docs/guidelines/git-flow.md` require recording that evidence before a ready PR/merge. No 033 merge or release is claimed.

## Review build

A separate development preview runs at http://localhost:5180 from the feature worktree (`zmk-customizer-033-preview`). It uses a separate origin from the existing 5173 application and does not overwrite that origin's saved project. Manual 033 acceptance remains pending; the preview is a review aid, not release evidence.

## Final repeat and delivery evidence

The changed panel/wiring journeys, affected selection scenario, reviewed paint crop and wiring keyboard scenario passed three sequential executions without retries: the full 173-case run above, then 20/20 in `/tmp/zmk-033-repeat-2.log` (59.6s) and 20/20 in `/tmp/zmk-033-repeat-3.log` (53.4s). Final sensitivity probes ran alone and restored exact bytes before the final successful static/coverage check. The final UI review found no unresolved blocking code issue; the mandatory spec reviewer verdict was ready for verification gates.

Scoped delivery uses one feature PR with `release:minor`. It remains draft because T031 manual acceptance is outstanding; ready/auto-merge submission is intentionally not claimed. The original workspace's unrelated edits were not staged or altered.


## Local integration — 2026-10-20

At the user’s explicit request to merge all work into the current version and commit, integrated feature 033 into the original workspace branch, preserving the previously uncommitted Lily58 correction, documentation and local UI/UX skill. This is a local integration, separate from protected-main PR delivery; T031 manual evidence and PR #15’s draft status remain unchanged. The previous original-workspace preservation boundary above describes the earlier delivery, before this new authorization.

The integrated tree passed `npm run check` in Docker (217 files, 1279 tests, coverage and static gates), `npm run build`, and all 7 Chromium integration scenarios in presets, schematic-panels and wiring-usability. Logs: `/tmp/zmk-merged-check.log`, `/tmp/zmk-merged-build.log`, `/tmp/zmk-merged-e2e.log`. Existing full feature browser/firmware results above were not rerun in full for this integration. No new manual accessibility or firmware result is claimed.

The original workspace development server now serves the integrated source at http://localhost:5173 (HTTP 200 verified). This supersedes the separate 5180 review-build instructions above. Existing origin-local project data has not been copied or cleared.

## PR #15 test/CI maintenance — 2026-10-21

Scope: T033; unchanged product behavior and all original migration assertions retained.
Spec Kit's persisted resolver selected 032; the actual checked-out branch and PR #15
are 033, which owns this follow-up. No additional feature or PR is created.

Inspected Actions run 39558568394 (PR) and duplicate push run 39558563953. Both
failed `check` on the duplicate dense legacy migration's 15-second timeout; both
failed `mutations` because the rotation seed referenced a test moved under geometry/.
This is a confirmed timeout sensitivity and stale test registration, not evidence
that random failures should be hidden through retries. E2E, image and firmware passed.
Observed PR job times: check 2m43s (unit phase 128.50s), E2E 9m17s (browser phase
8m09s, install 57s), image 20s, mutations 2m16s before failure, ZMK 14m30s.
The failed mutation duration is not a complete 29-seed baseline.

Local baseline, runs isolated from other checks: 217 files / 1279 tests passed with
coverage. JSON report `coverage/before-tests.json` measured 59.89s from suite start
through final test completion. Duplicate migration alone cost 6.51s; near-byte-budget
migration/round-trip cost 11.13s. Baseline layer-bar journey: 18/18 passed in 1.6m
(`/tmp/zmk-pr15-layers-before.log`). These host measurements are not directly comparable
to GitHub runner wall times.

Changes: merge the dense-bus assertions into the existing maximum-budget round-trip
test with its existing stress-test timeout; use domain tests for controller/deletion
business mutation seeds while retaining real-App UI-handler probes; repair the rotation
test path and verify every registered test file exists. Keep all six Chromium
viewport/theme layer-bar cases and their full add-through-32/focus/history assertions;
retain one representative case per Firefox/WebKit, removing ten repeated presentation
combinations. Zero retries, coverage thresholds and golden files are unchanged.

CI now runs all five jobs on every PR to main without firmware path skipping; no push
trigger, and obsolete revisions of a PR are cancelled. The release workflow remains
independent. Verified main protection through GitHub API: check/e2e/image/mutations/
zmk-build required, strict/up-to-date enabled, administrators included, conversations
resolved. No protection relaxation is needed or made. PR #15 remains draft because
T031 manual acceptance is still outstanding; this maintenance does not satisfy it.

Verification so far:

- Full Docker `npm run check` passed after formatting the changed files; type/lint,
  architecture/guidelines/tooling and all coverage floors passed. Its first attempt
  stopped on formatting, which was corrected. The temporary check log was mistakenly
  placed under coverage/, which Vitest cleans; the process exit was successful but
  that log was not retained. A separate isolated measured coverage run below retains
  the complete output outside coverage/.
- Isolated full coverage rerun: **1278/1278 passed**, 217 files; **59.23s** from suite
  start to final test (baseline 59.89s). The wire-contact file dropped **17.73s → 11.86s**;
  the remaining maximum-budget test took 11.79s. Removing 6.5s of duplicated work
  does not translate into the same parallel-suite wall-time saving. Coverage floors
  remain unchanged. Reports: ignored `.zmk-build/pr15-after-tests.json` and
  `.zmk-build/pr15-after-coverage.log`. The baseline report under coverage/ was cleaned
  by the subsequent coverage run; its measured values are recorded above.
- All seven mutation-runner tooling contracts passed. Ruby's standard YAML parser
  verified PR-only main triggers, all five jobs, unconditional firmware command and
  cancellation; `git diff --check` passed. Python YAML parsing was unavailable locally
  (no PyYAML), so no dependency was installed.

- Full isolated production-browser suite: **163/163 passed in 5.6m**, Chromium plus
  targeted Firefox/WebKit, zero retries (`.zmk-build/pr15-e2e.log`). Production build
  passed through Playwright's webServer command. No screenshots/goldens were changed.
- The changed eight-case layer-bar set passed three sequential executions without
  retries: the full suite above, then **8/8 in 40.5s** and **8/8 in 39.7s**
  (`.zmk-build/pr15-layers-2.log`, `pr15-layers-3.log`). Baseline was 18/18 in 1.6m;
  the focused runs save roughly 58% including their production-build startup. The
  full Chromium matrix and native overflow/focus/history checks remain covered.
- Full isolated `npm run test:mutations`: **29/29 detected by failing behavioral
  assertions**, including the repaired rotation seed and the two faster domain-test
  selections. Runner confirmed exact original-byte restoration
  (`.zmk-build/pr15-mutations.log`). No checks ran concurrently with the mutations.

No local firmware rebuild was repeated: emitted syntax, generators, catalog and
firmware infrastructure are unchanged. The previous PR revision's firmware check
passed; all five checks, including unconditional ZMK builds, must run on the new
PR revision. Historical CI success is not claimed for that new revision. T031 stays
open and the PR stays draft; no merge, manual acceptance or release is claimed.
