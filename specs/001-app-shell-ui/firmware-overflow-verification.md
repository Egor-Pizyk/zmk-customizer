# Firmware overflow repair — 2026-10-25

Bug route: shell FR-001/FR-006, FSO-1–3. Resolver selected 036; inspection identifies shared shell 001 as owner, not new onboarding. Isolated fix worktree from origin/main 53ca1c0 preserves unrelated staged audit edits and open onboarding work; acute user-reported regression justifies separate repair branch.

Direct Playwright runs are required for tests-first layout diagnosis. Red: both Chromium viewport cases fail: document height 3740px at width 1024 and 2632px at width 1440 instead of 800px. Logs: `.check-logs/firmware-red.log`.

Risk → coverage: long settings overflow → native wheel over navigation, stationary sidebar/document, actual last setting reachable; empty search → visible empty result. No project mutations in this presentation-only journey; saved/exported data covered by existing Firmware journeys.

FSO-2: `main` lacked a positioned containing block: absolute screen-reader descriptions escaped its scroll clipping. Adding `relative` contains them within the existing scroll owner. Chromium red/green verified at both widths; screenshot review confirms sidebar, project bar, bottom settings and footer remain correctly placed. Firefox wheel input advances in bounded increments, so bottom reachability retries native wheel input until the last setting is visible. Cross-engine and changed checks pending. OS/screen-reader manual acceptance unperformed.
