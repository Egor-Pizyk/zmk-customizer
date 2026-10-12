# 0012. Test observable behavior with real React and DOM

Status: Accepted
Date: 2026-10-12

## Context
Server-rendered HTML string checks and mocked React hooks cannot prove that controls
work after user interaction. The user requested regression protection for business
rules and presentation, without tests duplicating the compiler or linter.

## Decision
Use Testing Library React/DOM, user-event and jsdom as development-only dependencies.
Render real components and providers, query roles and accessible names, perform user
actions and assert visible output or persisted/exported data. Mock external browser
boundaries and unavailable platform APIs only; never React state or domain functions.
Use Vitest V8 coverage to discover gaps and enforce regression floors in `make check`.
Keep golden files for generated ZMK syntax. Verify critical tests against deliberate
business-rule mutations. These libraries avoid maintaining our own DOM/event simulator.

## Consequences
Tests tolerate internal refactoring while detecting changed product contracts.
jsdom does not verify CSS layout, actual painting, native focus trapping or firmware
compilation; semantic DOM and SVG geometry checks must not claim visual equivalence.
No dependencies enter the production bundle.
