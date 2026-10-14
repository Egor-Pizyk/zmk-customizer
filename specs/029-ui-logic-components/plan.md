# Plan

Move the 16 currently mixed groups, mirror unit contract locations and update imports by defining symbol ownership. Retain unrelated pure .ts/.tsx groups. Remove empty parent APIs rather than exposing compatibility barrels. Update exact aliases, effect registry, lint exceptions, architecture fixtures, mutation runners and documentation. Resolve any new barrel cycles through owning logic contracts, not cycle-rule exceptions.

No new user journey: reuse existing unit/integration and production Chromium/Firefox/WebKit coverage. Add tooling contracts for child API ownership and the mixed-folder structural rule. Run make check, production build and make test-e2e; no firmware generator or exported geometry changes, so no new ZMK build is required.

## Context dependency adjustment

ProjectContext, its consumer hook and provider state hook live in project/logic. The JSX provider stays in project/components and consumes the logic contract. This avoids a logic-to-provider barrel cycle while retaining the same context instance, latest-state updates, import invalidation and undo/history behavior. The runtime generator bridge moves to export/logic/get-export-preview.ts; its exact architectural exception moves with it.
