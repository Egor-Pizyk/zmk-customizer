# Verification stage refactor evidence

Base5f201a01fa552280290bcd303f9579ec2d6980aa; user scope2026-10-30 is
command/cadence separation, not product changes. VC01–06 matrix was defined before
new test assertions. Module implementation and guidelines/agents/templates are ready.
Static `npm run check` passes (`verification-stages-static2.log`): architecture,
app/E2E types, lint and format only. No application unit or browser suite ran there.

Public commands and exact staged worker tests assert process selection, unit fallback,
receipt isolation, preserved staged bytes, fail/force invalidation and explicit focus
file/name/module behavior. Static and unit stages cannot call Playwright. Legacy
production-to-browser focus mapping is removed. CI retains independent tooling units,
coverage and browser jobs. Preset regenerated with pinned Spec Kit; integration status
reports zero modified/missing managed files. Context audit has no broken local targets.

At the completed task boundary, run all app/tooling units next. Focused diagnostics
are reserved for failures from that run; final full configured E2E follows only after
repairs. No premature red run or repeated mid-task E2E was performed. Historical
combined-run logs establish the previous unwanted browser expansion; current explicit
stage/empty-focus counterexamples are asserted by the new tooling tests. No new app
behavior, schema, dependency, source mutation or browser assertion change is intended.


First full test:unit run:1626/1626 app units pass,132/135 tooling units pass
(`verification-stages-unit-all.log`). Two snapshot/cache tests fail because the Alpine
dev image lacked Git; the bounded-summary fixture still requested retired focus mode.
Add Git to the development image (not the final nginx runtime), use the static fixture
mode and diagnose only these three failed files with test:unit:focus after rebuilding.
No business test assertion changed. The new stage-selection/focus-dispatch tests pass.


Dev image rebuilt with Git; the three repaired files pass6/6 focused tests via the
new public command (`verification-stages-unit-focus.log`). This focus follows the
actual failed full run; no unrelated unit subset was rerun. Application source and
browser assertion files are unchanged. Rebuilt dev server remains available on5173.
Final module/static and complete unit checkpoint follow; then one configured E2E run.


Final complete module check passes (`verification-stages-static-final.log`). Full
public test:unit command now passes1626/1626 application tests and135/135 tooling
units (`verification-stages-unit-final.log`). New command contracts verify no browser
subprocess in static/unit stages, bounded focus targets and separate cache receipts.
No source-mutating sensitivity experiment was performed; invalid-input/failure/cache
counterexamples are exercised by tooling units. Final full configured E2E is next,
not a partial mid-task browser diagnostic. Application source/assertions are unchanged.


Final command review separates architecture-checker self-tests as well: check:architecture
now runs the actual architecture scanner only; its Node self-tests remain in test:unit's
tooling stage. VC06 explicitly rejects a hidden test runner there. This changes no
application/browser/build inputs; the ongoing final browser run uses unchanged app,
Playwright configuration and build command. Static/unit command validation is repeated
for this completed tooling refinement; browser evidence retains its unchanged scope.


Final results: pure static check passes (`verification-stages-static-pure.log`),
full unit checkpoint passes1626 app +135 tooling tests
(`verification-stages-unit-pure.log`). The complete configured E2E suite passes
420/420 across Chromium/Firefox/WebKit,19.5m (`verification-stages-e2e-final.log`).
This was one explicit final full browser run, not per-module or hidden execution.
Git diff confirms no application, E2E assertion, Vite or Playwright config changes.

The staged static smoke passes in9263ms with no unit/browser stage
(`verification-stages-staged-static.log`); static/unit plan JSON confirms empty browser
selection in both and no static selection for unit-only. Unit-only process execution,
fallback and receipt isolation are covered by the135 tooling tests; the changed-unit
command was planned, not redundantly executed after the successful full-unit checkpoint.
Old combined and new static/unit receipts remain separate. Preset integration status
reports zero managed-file drift; context/link audit passes. Final reporting-only
checkbox/version edits require only the static commit hook, whose exact-tree receipt
is captured in `verification-stages-commit.log`. No CI, firmware, deployment or manual
screen-reader result is claimed. Commands/agent workflow maintenance is complete.
