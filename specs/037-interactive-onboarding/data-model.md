# State model: Interactive onboarding

No change to Project schema v13 or exported project format. All application models are readonly plain values; DOM references remain UI-only.

## Persisted records (storage/onboarding)

- **OnboardingShownRecord**: `version: 1`, `hasBeenShown: true`. Dedicated key, independent from preferences resets, Project and tutorial draft. Absence means first visit. Write on visible first offer, not completion.
- **OnboardingSessionRecord**: `version: 1`, `tutorialRevision: 1`, nested `project: Project`, stable `stepId`, informational `acknowledgedStepIds`, and `outcome` (`in-progress`, `closed`, `completed`). Store no DOM targets, functions, timestamps, environment IDs or original history. One optional retained tutorial record only.
- Record/project schema validation and nested historical Project migration happen in storage. Reject unknown future envelope/tutorial revisions without overwriting raw data; offer recovery/discard. Validate recognized step IDs and limit acknowledgement arrays to the current finite definition. Unknown steps from an older supported revision reset to the first unmet prerequisite with a visible explanation, never auto-complete.
- Shown/session records use separate keys. Session failure cannot erase the shown marker or touch normal Project bytes. A marker write failure warns that future once-only display cannot be guaranteed.

## Active editing session (project provider)

Discriminated `kind: normal | tutorial`. Normal contains existing ProjectState. Tutorial contains active tutorial ProjectState, parked original ProjectState and a session identity plus tutorial UI metadata. Exactly one `history.present` is exposed through useProject at a time. The parked snapshot is not a second independently editable store.

`ProjectState` retains past/present/future, saveError, autosave protection and damaged backup state. Original history is parked exactly and restored in the same runtime; no history persistence is introduced. Project changes are immutable normal domain operations. Selection/drafts/panels remain workspace-local and reset on session identity change. Shared analysis uses the active immutable Project identity.

## Step definition and progress

Each step has stable `id`, workspace/target ID, short what/why/action copy and a discriminated condition (`project-result`, `acknowledgement`, `file-inspection`, `zip-download`). Domain conditions accept only domain facts; UI target/DOM metadata stays in UI definitions. Ordered definitions derive progress numbers. Repeated per-key steps use stable exercise slots, not unstable array indexes as persisted entity identity.

Project-result conditions always use current accepted state; preview isn't accepted. Acknowledgements are bound to their step and invalidated if prerequisites no longer hold. File-inspection/ZIP success is bound in memory to the session and Project reference. Do not restore a persisted download receipt as permission to finish a changed/resumed project; require current preview and a fresh ZIP handoff.

## Transitions and failure ordering

| Action | Preconditions | Result |
| --- | --- | --- |
| First show | No shown marker; app visible | Show offer and attempt marker write once; no Project edit |
| Begin new | Original safely saved; initial tutorial write succeeds; retained draft discard confirmed if needed | Park original state, activate empty tutorial history and route writer |
| Resume | Valid retained record, original safely saved | Park original; activate retained Project, recompute earliest unmet condition |
| Commit/Undo/Redo | Tutorial active | Compute candidate normal immutable history; save tutorial envelope first, accept only on success; recalculate conditions |
| Back | Earlier step exists | Change UI step only, no history edit |
| Next/acknowledge | Informational/current-value inspection condition | Record acknowledgement, advance once |
| Applied action | Fresh condition succeeds | Advance once; preserve the successful edit |
| Exit/skip | Always reachable | Ask retain/discard tutorial; persist choice safely, restore original state/workspace |
| Reload | Any phase | Normal loader restores original; no active tour; optional explicit resume |
| Download success | Session/project still match, required conditions hold | Show completed result; persist outcome if possible |
| Adopt | Explicit confirmation, original file-save action available | Save tutorial to normal destination first; only success replaces original and permits cleanup |

If later tutorial save fails, refuse the candidate edit and preserve the previous accepted tutorial state and parked original; expose retry and exit. Do not mark the rejected result successful or advance a step. This transactional publication applies only to tutorial edits; normal project autosave behavior remains unchanged. If adoption fails, keep mode tutorial and both data sets. Cleanup failure after successful adoption is non-destructive and must not roll back the normal save. Session transitions invalidate pending imports and async export receipts.
