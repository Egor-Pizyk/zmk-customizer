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
