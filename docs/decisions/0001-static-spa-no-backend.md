# 0001. Static single-page app, no backend

Status: Accepted
Date: 2026-09-27

## Context
The product turns a keyboard description into text files. All inputs are typed by the user; all ZMK facts can be shipped as static data. Firmware compilation is a non-goal (users build via their zmk-config GitHub Actions). A server would add hosting cost, accounts and privacy questions without enabling any core flow.

## Decision
Ship only static files (`dist/`). No backend, no runtime network calls, no telemetry. State lives in `localStorage` and user-exported JSON files. The app works offline after first load.

## Consequences
- Deployable to any static host; production image is nginx serving `dist/` (0005).
- ZMK catalog data must be bundled and pinned to one ZMK version; updating ZMK is a code change.
- No sharing by URL or cloud sync; sharing is by JSON file.
- `localStorage` and imported files are the only untrusted inputs, parsed in `src/storage/` (0003).
