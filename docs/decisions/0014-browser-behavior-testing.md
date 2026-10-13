# ADR 0014: Real browser behavioral testing

Accepted 2026-10-13. Add @playwright/test as a pinned dev dependency. A browser runner provides native SVG/foreignObject hit testing, pointer capture, layout/paint and dialog/input behavior that a few custom scripts or jsdom cannot reliably provide. No runtime dependency or application network behavior changes. Chromium runs complete behavioral journeys in CI; Firefox/WebKit exercise critical engine-sensitive interaction. Tests use production output and isolated contexts, UI fixture import, real gestures and actual downloads. Keep domain permutations in Vitest. See specs/025-playwright-e2e.

@types/node is also dev-only, pinned to the tooling runtime's major version (24), for strict typing of test file/download boundaries. The new test code is included in TypeScript and lint checks. E2E-only lint exceptions permit sequential browser protocols, prerequisite guards and readonly fixture copies; production rules are unchanged.
