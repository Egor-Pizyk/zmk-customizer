# Implementation Plan: Export download

**Branch**: `010-export-download` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)
**Input**: specs/010-export-download/spec.md

## Summary

Compose the validated 009 shield output into the official zmk-config repository layout, share that exact file set with preview and single-file actions, then package it using approved fflate. Keep existing 009 generator contracts unchanged.

## Technical Context

**Language/Version**: TypeScript 7 strict, React 19, Node 24 in Docker.
**Primary Dependencies**: Existing React/zod plus approved fflate, locked by package-lock.json.
**Storage**: In-memory export choice/feedback only; no Project changes or schema migration.
**Testing**: Vitest unit, independent repository golden files, ZIP extraction/metadata/determinism, browser-adapter failure tests and UI handler tests.
**Target Platform**: Desktop browser, static Vite app, offline after load.
**Project Type**: Static web application.
**Performance Goals**: Existing preset ZIP completes without duplicate requests; deferred ZIP task reports busy state.
**Constraints**: No runtime networking, no new boards/split/firmware compilation; ZMK v0.3 pinned facts in catalog.
**Scale/Scope**: One current unibody preset, 10 repository files by default and 9 without workflow.

## Constitution Check

Pre-research and post-design: PASS for all eight principles. Correctness: golden repository plus ZIP checks; domain first: existing validation owns blockers, no new domain rules; static: browser APIs and bundled fflate only; untrusted data: existing schema boundary unchanged; explained options: workflow choice description and pinned documentation link; minimal: one composition generator, one ZIP adapter, one shared Blob download adapter; deterministic: sorted paths, fixed ZIP metadata; accessible: labeled actions, busy/disabled explanation, existing announce region. Approved dependency requires no ADR. No violations.

## Project Structure

Documentation: spec.md, checklists/requirements.md, plan.md, research.md, data-model.md, contracts/export.md, quickstart.md, tasks.md.

Source changes:
- src/catalog/shield-target.ts: release revision and reusable-workflow path/ref.
- src/generators/generate-repository-files.ts and adjacent golden tests: compose 009 outputs, relocate user conf, add user keymap and support files; inputs include pinned target and workflow inclusion.
- src/storage/build-export-zip.ts and tests: deferred fflate ZIP with stable metadata, return owned Uint8Array bytes.
- src/ui/download-blob.ts and tests: browser download cleanup, shared by text and ZIP; existing download-text-file.ts delegates preserving JSON default and adds optional MIME.
- src/ui/export/use-export-actions.ts and tests: pending lock via ref, captured file snapshot, announce and visible feedback, clipboard and download handlers.
- src/ui/export/export-workspace.tsx and tests, export-toolbar.tsx, file-preview.tsx and get-export-preview.ts: workflow checkbox, ZIP action, per-file copy/download, exactly composed preview.
- tests/fixtures/generated/repository/: independent full expected files and DIFFERENCES.md, derived from existing 009 goldens and documented pinned official template.

**Structure Decision**: Keep pure text composition in generators, ZIP serialization in storage and DOM/clipboard effects in ui. No effects or additional context.

ZMK source references for repository support files: [shield-files.md §1–2/6](../../docs/zmk/shield-files.md) and [pinned release](../../docs/zmk/README.md).
