# Implementation validation guide

This is a future acceptance/run guide, not evidence of checks already performed.

## Prerequisites

Integrate final merged 032 into the main-based feature branch first, preserving local changes. Resolve 033 with `bash .specify/scripts/bash/check-prerequisites.sh --paths-only --json`; read plan/tasks and applicable routed docs. Docker runs Node 24; isolated Playwright is allowed, ordinary browser/CUA use requires an explicit user request. No runtime network/service is needed.

## Scenarios

1. Import independent v11 three-key pass-through fixture. Move A, B and C separately by drag and fields; compare visible orthogonal leads and expected net membership after each move, Undo/Redo and file/reload. Repeat diode, split and insulated counterpart. Moving through unrelated wire never adds membership.
2. Import partial matrix/direct projects. Complete wiring retains manual axes/pins/conductors and only adds missing connections. Test no-op, candidate collision, occupied encoder pins and capacity refusal. Rebuild is separate, explains replacement and shows removals. Cancel/refusal leaves saved JSON unchanged; Apply is one history step. Inspect actual ZIP GPIO/RC bytes.
3. Select a bent section between connected points, then Shift-select another. Delete via canvas key and list/button. Only highlighted spans disappear; keys, controller assignment on surviving endpoints and independent branches persist. Repeat overlap and insulated-crossing list disambiguation; Undo/Redo/reload agree.
4. Open each Schematic editor at 1440×900, 1280×800, 1024×768, 768×1024 and 390×844, both themes. Measure the budgets in spec US4 using actual DOM rectangles; test scroll, close/collapse/reopen, focus and preview cancellation. Check Settings native modal/Escape and viewport margins. Run effective 200% layout automation and a separately recorded actual zoom pass.

## Commands

Focused suites follow `docker compose -p zmk-customizer -f infra/compose.yaml run --rm app npm run test -- <test-path>`; use exact task paths. Full required checks:

```
make check
docker compose -p zmk-customizer -f infra/compose.yaml run --rm app npm run build
make test-e2e
make zmk-build
```

Run changed E2E scenarios three sequential times without retries in the isolated production runner. Run controlled sensitivity regressions separately/alone, restore exact files and require intended behavioral failures. Do not run destructive cleanup to prepare checks. Review the specification and project UI/accessibility guidelines and inspect actual rendered UI, then record findings/evidence in verification.md.

Manual acceptance covers keyboard, VoiceOver/Safari, OS theme/reduced-motion and 200% zoom; automation does not establish speech or manual acceptance. Unperformed mandatory checks remain open. Before delivery re-read git-flow; keep this feature's spec/code/tests in one feature PR, release:minor, and submit auto-merge only after applicable acceptance gates; no CI polling.
