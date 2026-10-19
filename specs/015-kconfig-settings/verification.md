# Firmware settings verification

2026-10-18, branch `015-kconfig-settings`, uncommitted shared tree includes 014. Technical implementation and required automated/build gates passed; manual accessibility remains pending, so the feature is not formally complete. No commit created.

## Tests-first and reviews

- Domain/storage initial failing run: `/tmp/zmk015/red.log`; domain imports absent and malformed firmware was stripped. Subsequent initial 22 contracts passed.
- Independent generator golden/split routing failing run: `/tmp/zmk015/generator-red.log`; placeholder conf and missing half paths failed before generator implementation.
- BAS effective-default/disabled-parent regression failed before repair: `/tmp/zmk015/bas-red.log`.
- Resource guard regression failed before repair: `/tmp/zmk015/budget-red.log`; shared domain/storage limits now prevent committing an unsaveable 129th override or 1025-character string. App tests assert actual saved-state retention, reset unknown override/retry, and malformed firmware import preservation.
- Independent spec reviewer identified hidden-focus design and stale roadmap questions; resolved by generic reveal signal before deferred focus and owning document reconciliation. Repeat read-only analysis found no remaining design blocker. See [timing deviation](analysis.md): initial domain work began before independent verdict; this historical deviation is recorded, not retroactively called compliant.
- Independent implementation review found storage budget drift and missing prerequisite descriptions; both resolved, reviewer recheck found no remaining scoped blocker.
- Independent ZMK reviewer verified pinned defaults/dependencies, USB central routing, battery remote-service requirements and direct-scanner wake support. Pointing was never an existing binding capability; removed that inaccurate preservation claim without adding scope.

## Measured commands

| Command | Result and evidence |
|---|---|
| Focused storage suite (`npm run test -- tests/unit/storage`) |181 tests / 21 files passed; `/tmp/zmk015/storage.log` |
| Earlier full `make check` |1073 tests / 181 files passed with coverage/static checks; `/tmp/zmk015/check-final.log`. Final expanded `make check` passed 1075 tests / 181 files, all static gates and coverage floors; `/tmp/zmk015/check-complete.log`. Coverage: 91.27% statements, 84.67% branches, 92.36% functions, 91.20% lines. |
| Earlier full `make test-e2e` |120 tests passed, 4.6m, zero retries; `/tmp/zmk015/e2e-full.log`. Includes 014 and 015. Final expanded full run also passed 120 tests in 4.5m; `/tmp/zmk015/e2e-complete.log`. |
| Firmware focused browser scenarios |7 passed Chromium/Firefox/WebKit; `/tmp/zmk015/e2e-second.log`. Final three sequential repeat logs: `/tmp/zmk015/e2e-repeat-{1,2,3}.log`: 7/7 each, 30.5s / 33.3s / 35.8s, zero retries. These include shared and split preview byte assertions. |
| Explicit production build (`docker compose -p zmk-customizer -f infra/compose.yaml run --rm app npm run build`) |Passed, `/tmp/zmk015/build.log`; Vite chunk-size advisory only. |
| Controlled browser sensitivity (`python3 /tmp/zmk015/sensitivity.py`, alone) |Passed: suppressing domain firmware commits caused the real saved-project assertion at firmware.spec.ts:40 to fail (`expected four overrides`, received `{}`); one behavioral failure, no compiler/runner error. Exact original bytes restored with SHA256 `bb21ae9b30ca808a5be0f7357a708faa298e90d6379db225a3253804df0eef7c`. Logs `/tmp/zmk015/sensitivity{,-result}.log`; trace/screenshot retained in ignored `.e2e-mutations/firmware015/`. Restored Chromium baseline passed 1/1 in 9.7s (`/tmp/zmk015/e2e-restored.log`). |
| Final `make zmk-build` |Passed all 22 deterministic actual-export targets plus intentional invalid-connector rejection; `/tmp/zmk015/zmk-build-complete.log`. Firmware direct/unibody 7 and split left/right 10 each assert 27 resulting `.config` values across the three Firmware targets, including escaped quote/backslash bytes. |
| Initial `make zmk-build` |All 22 targets compiled, final assertion failed because the peripheral manufacturer symbol retains upstream default `"ZMK Project"`, rather than being absent. Output correctly omitted the user override; independent expected .config corrected to the pinned default. `/tmp/zmk015/zmk-build.log`. Full rerun additionally exercises quote/backslash string serialization. |

## Observable coverage and limits

Typed switch/int/choice/string values survive native edits, exact undo/redo, reload and downloaded/opened JSON. Search/empty result and field cancellation preserve committed data. Invalid range produces inline text, Firmware badge, Problems navigation through filtered controls and blocked ZIP; correction/reset restores export. Independent sorted CONFIG golden includes escaped string bytes and default omission; explicit choice default removes selected member. Actual downloaded ZIP is inspected for config content/paths, unchanged hardware defconfig, and both split half configs without shared conf. Preview text is compared byte-for-byte with downloaded config. Build target metadata verifies resulting .config values, including common settings on both halves, central-only enable absence on peripheral, and its unchanged USB manufacturer default.

Historical v1–v7 JSON fixtures remain untouched; current constructor/expected schema values upgrade to 8. No-override firmware output comment and existing golden outputs remain unchanged. Strings 1024 characters and 128 override entries are parser/resource bounds; valid manufacturer ≤64 UTF-8 bytes is a semantic rule. Invalid but repairable values remain loadable and removable.

Manual gate T013 is pending: explicit browser authorization/user assistance has not been given. No CUA, normal browser profile, screen-reader speech, keyboard-only human pass, 200% zoom, dark/reduced-motion inspection or physical keyboard test is claimed. Automated native keyboard/focus assertions do not replace that gate. Vite reports its existing chunk-size advisory. Pinned builds warn about deprecated NRF_STORE_REBOOT_TYPE_GPREGRET, SETTINGS_NVS choice selection, UART_INTERRUPT_DRIVEN dependencies and board ZMK_USB default on split peripherals; compilation and all resulting-value assertions pass. No generated central override is applied to the peripheral; no new runtime dependencies.
