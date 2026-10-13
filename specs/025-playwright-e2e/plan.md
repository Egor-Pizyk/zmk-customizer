# Implementation Plan: Real browser behavioral coverage

**Branch**: `025-playwright-e2e` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

## Summary

Playwright tests production Vite output through real app entry, providers, storage and downloads. Focused layout contracts cover every edge/corner and rotated anchors; fewer integrated journeys cover identity, wiring, bindings, recovery and keyboard/dialogs. Fixtures enter through real JSON import. No production test hooks.

## Technical Context

TypeScript 7 / Node24; React19; @playwright/test dev-only. Production localStorage and JSON/ZIP downloads. Chromium full mandatory suite, Firefox/WebKit focused cross-browser subset. Desktop 1440×1000, light theme, isolated contexts. Serial worker and no retries; state waits, no sleeps/forced interaction. Docker E2E uses glibc Node24 Bookworm because existing Alpine cannot run supported Firefox/WebKit builds. Static app, no backend or runtime networking added.

## Constitution Check

Before and after design: PASS. Domain/generator contracts remain pure and tests-first for any repair; real services and deterministic fixture expectations; untrusted data enters storage import; accessibility uses roles/names and keyboard. Only dev dependency added with ADR. No schema or runtime dependency changes planned. Existing unit floors retained.

## Project Structure

`tests/e2e/` contains helpers, layout and product specs plus reviewed focused snapshots. `playwright.config.ts`, `tsconfig.e2e.json`, dedicated Docker/compose service, npm/Make commands, CI artifact retention. `scripts/check-e2e-mutations.py` performs standalone six-seed checks with byte restoration. Feature artifacts include coverage matrix and verification evidence.

## Execution

1. Install/configure browser toolchain, add independent geometry and download observations.
2. Author real gesture cases before repairs; record failures and fix owning UI layer only as needed.
3. Complete product/keyboard/recovery journeys and reviewed visual reference.
4. Run standalone seeds, restore files, then make check/build/E2E, three sequential Chromium runs and cross-browser subset. Run ZMK build if exported geometry/generators change.
