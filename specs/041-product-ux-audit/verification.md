# Product workflow clarity verification

Baseline: origin/main at `73b2b0f7fa9aceb01bd516a6ec02fb51022ca71a`. Orca worktree isolated the current release from open PRs #29 (project controls, KLE and Parts), #34 (JointJS) and #41 (routing). Existing workspace behavior was available on main. The initial worktree and local branch disappeared during baseline Chromium execution. With user confirmation the worktree was recreated independently at the same base.

## Findings and change decisions

| Priority and requirement | Baseline observation | Change and check |
|---|---|---|
| P1 / FR-001 | From the empty project, Export showed controller details and workflow before the disabled download and the first linked error. The count read “1 problems”. Repair already reached Add key. | Put a single correctly inflected count with the linked repairs first. Retain the disabled ZIP affordance. Show configuration once export is available. Move controller connector explanation out of the export path since it belongs to Schematic. Verify first Tab repairs, and the product journey repairs a GPIO and downloads the actual ZIP. |
| P2 / FR-002 | Empty Schematic had Duplicate, Delete, Renumber and Precise properties alongside KLE. Empty Bindings showed advanced tools before the path to Schematic. Populated Bindings tabbed into optional editors before its current layer. | Hide actions whose prerequisites do not exist. Add key, KLE and all populated-project editing paths are preserved. Show the primary Bindings context first. Test first key, Undo and keyboard order. |
| P2 / FR-003 | Clear search looked actionable with an empty field and left focus outside the field on activation. | Disable when empty and return focus to search on clear. No-results and hidden issue recovery use the existing controls. Verify the next query can be typed immediately. |

The hierarchy and availability changes address order and focus directly. Renaming alone would leave optional and unavailable actions in the way. None of these changes require migrating a project or adjusting generated files. Onboarding explains the revised Export and Firmware paths.

## Audit coverage

- First launch and tour dismissal were observed in Orca. Chromium covered rich editing flows listed below. PR #29 owns changes to the New dialog and KLE placement. Revisiting New or reorganizing Parts here would overlap that PR.
- Schematic owns physical layout and wiring. Baseline passes before interruption included precise and pointer editing, connected movement, crossovers, wiring tool controls, key clipboard, selection and Undo/Redo. The routing proposals in #41 are outside the shipped baseline.
- Bindings baseline covered picker search, layer editing, encoder bindings, custom behaviors and advanced keymap lifecycle including real ZIP content. Firmware baseline covered typed inputs, visible errors, hidden-field repair, restore defaults, split output and fixed sidebar at 1024 and 1440px.
- ZMK Editor demo in Orca opened with a four-choice welcome, then a Lily58 with active layer tabs above the board. Selecting Esc exposed keycode choices, modifier toggles, a source field, Transparent/None and clipboard controls. This supported putting layer context ahead of optional editors. GitHub accounts, USB Studio and hardware builds were outside the demo review. No code or assets were used.
- Both design skills were installed under ignored node_modules in the first worktree. Impeccable Operate and Distill guidance informed task order and removal of duplicate cues. Taste Skill's website layout approach was reviewed and left out. The existing project guidelines remain the design authority.

## Evidence

- Baseline Chromium log: `/tmp/zmk-ux-baseline.log`. 72 of 138 passed before checkout removal. Worker exits and omitted cases that followed are inconclusive.
- Tests-first in the restored worktree: all four added assertions failed on the prior UI with the expected focus/availability differences. Log: `/tmp/zmk-ux-red.log`.

- The full Chromium browser run passed 142 scenarios, including first launch and replay, blank and preset starts, manual and automatic GPIO wiring, Bindings libraries, preferences, shortcuts, real JSON and ZIP, invalid-file recovery and history. Log: `/tmp/zmk-ux-after.log`.
- Captured all four initial workspaces in isolated Chromium with reduced motion at 640px dark and 1440px light. Document width fit both sizes. The visual pass revealed a gap between the empty Bindings message and its action. They now sit together. The revised dark 640px capture measured 80 CSS px from heading to button and no horizontal page overflow.
- Impeccable mechanical review reported zero detections for the first implementation snapshot. Focus diagnostics found one redundant JSX fragment, removed before final staged checks. The checked app snapshot before the final test-only adjustment passed types, architecture, guidelines, lint, format, units and Chromium.
- The competitor’s Settings view offered a setting-group navigator and per-setting reset. Build & flash displayed a GitHub login gate. Only the unauthenticated gate was observed. Validation feedback behind login was not verified.

- The six focused Firefox and WebKit scenarios passed, including keyboard activation and repair focus. The macOS WebKit test uses Option+Tab to include all controls, as in the existing accessibility tests. Log: `/tmp/zmk-ux-cross-final.log`.
- A local concurrent browser run interrupted the Docker result mount with `ENOTDIR`; the final staged check was restarted alone.

## Follow-ups outside this change

- P2: Recheck the New dialog hierarchy and empty Parts density after PR #29 has landed. That branch already changes both surfaces.
- P3: Review Firmware field density and disabled reset repetition in a separate focused pass. Preserve exact catalog information and keyboard editing.
- Native screen-reader audio, 200% browser zoom and physical firmware compilation were not exercised. The current change leaves generation untouched. The first two remain open manual acceptance on the draft PR.
