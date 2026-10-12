# Feature Specification: Export download

**Feature Branch**: `010-export-download`
**Created**: 2026-10-12
**Status**: Draft
**Input**: Continue roadmap 010 through the complete Spec Kit workflow.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download a complete keyboard repository (Priority: P1)

A builder downloads the valid keyboard as a ZIP, extracts it into a repository, and has the configuration needed for the external ZMK build.

**Why this priority**: The existing preview becomes a usable artifact.
**Independent Test**: Download the preset and compare every extracted path and file with the expected repository.

**Acceptance Scenarios**:
1. **Given** a valid preset, **When** Download .zip is activated, **Then** the archive contains shield files, user keymap/configuration, module declaration, pinned release manifest, build target and GitHub Actions workflow at repository-root paths.
2. **Given** the same project and export choices, **When** downloaded twice, **Then** ZIP bytes are identical.
3. **Given** a project with errors, **When** Export opens, **Then** download is disabled, an explanation names the number of problems, and each problem links to the workspace that fixes it.
4. **Given** the workflow checkbox is cleared, **When** downloading, **Then** only the workflow is omitted and preview shows exactly the selected archive file set.

### User Story 2 - Use a single generated file (Priority: P2)

A user copies or downloads one previewed file to update an existing repository.

**Why this priority**: Small updates should not require extracting an archive.
**Independent Test**: Copy and download each previewed file and compare its text with the preview.

**Acceptance Scenarios**:
1. **Given** a valid project, **When** Copy file is activated, **Then** exact file text is copied and success is announced.
2. **Given** a valid project, **When** Download file is activated, **Then** its basename is downloaded with exact UTF-8 content.
3. **Given** denied or unavailable clipboard access, **When** copying, **Then** a readable error offers selection of the preview text and retry remains possible.

### Edge Cases

- Empty projects and all existing validation failures block every file export; fixing or undoing an error restores actions for the current project.
- Export failures leave the project, autosave and undo history unchanged; show a readable error and allow retry.
- Repeated clicks while ZIP construction is pending start only one download; the action reports progress.
- Export uses the project snapshot and workflow choice at activation; later edits never mix versions in an archive.
- Export works without network connectivity after app load. Browser save location and clipboard permissions are browser controlled.
- Files with no settings retain the existing generated commented configuration content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Export MUST provide Download .zip for a valid project, named `<shield-name>-zmk-config.zip`, with files directly at archive root, without an enclosing directory.
- **FR-002**: Archive and preview MUST include `boards/shields/<name>/Kconfig.shield`, `Kconfig.defconfig`, `<name>.overlay`, `config/<name>.keymap`, `config/<name>.conf`, `zephyr/module.yml`, `config/west.yml`, and `build.yaml`; retain the shield default keymap from 009 and put user configuration only in config.
- **FR-003**: Manifest and optional GitHub workflow MUST target the same pinned ZMK v0.3 release; build target MUST use the existing nice_nano_v2 board and project shield name.
- **FR-004**: Users MUST be able to include/exclude `.github/workflows/build.yml`, included by default; this is a temporary export choice, not project data.
- **FR-005**: Same project and choice MUST produce identical archive bytes with stable paths and fixed metadata, regardless of export time.
- **FR-006**: While any validation errors exist, ZIP download MUST be disabled with an associated visible problem-count explanation; linked errors MUST replace previews and single-file actions.
- **FR-007**: Each previewed file MUST provide labeled keyboard-accessible copy and download actions that preserve exact text; downloads use the path basename.
- **FR-008**: ZIP construction MUST expose pending state, prevent duplicate activation, announce success or failure, and permit retry after failure.
- **FR-009**: Clipboard and download failures MUST show readable feedback without changing project or history; unavailable clipboard MUST offer manual copying from the preview.
- **FR-010**: Export MUST run locally offline after load and MUST export a consistent activation-time snapshot.

### Key Entities

- **Repository file**: repository-relative path and exact text, shared by preview, single-file export and ZIP.
- **Export choice**: temporary inclusion of the GitHub Actions workflow, default on.
- **Export feedback**: pending, success or readable failure for an export action; separate from project validation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every extracted preset file and the complete path list match the expected repository, with and without the workflow.
- **SC-002**: Repeated exports of an unchanged project and choice have byte-identical archives.
- **SC-003**: All previewed files can be copied/downloaded with exact content using keyboard-reachable labeled actions.
- **SC-004**: Invalid projects expose zero preview files or single-file exports and cannot start ZIP download; corrected projects recover.
- **SC-005**: Export requires zero network requests and preserves project and undo history in success and failure cases.

## Assumptions

- Depends on implemented 009 generators and validation. Scope is its existing unibody matrix keyboard and fixed controller; split and board selection remain later features.
- Use the documented v0.3 tag for manifest and reusable workflow, resolving the roadmap open revision question from docs/zmk/README.md.
- Workflow inclusion defaults on and resets when Export is remounted; no schema migration is needed.
- Out of scope: pushing to GitHub, compiling/flashing, settings, new wiring types, boards or split support.
