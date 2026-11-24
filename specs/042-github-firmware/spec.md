# GitHub repository and firmware builds

**Branch** `feature/042-github-firmware`

**Status** Accepted for implementation

## User scenarios

### Connect a repository

A builder opens Export, connects a GitHub account and selects a repository and branch. They can create a dedicated repository or connect an existing one. Connecting displays the destination and reads its state. The branch changes only when the builder confirms a commit.

- A newly created destination is usable for a first publication, with its visibility chosen explicitly.
- A missing branch, insufficient permission or revoked authorization produces a recovery action in Export. The local project stays open.
- The builder can disconnect and later choose another destination.

### Publish and update firmware configuration

A builder previews the generated files and reviews their destination, the files to be changed and the commit message. Confirming writes a single commit to the chosen branch. The builder can edit the project and publish again from the same workspace.

- An invalid project cannot publish. The same repair links used for ZIP export are available.
- A first publication preserves unrelated files and shows any existing file that would be replaced. Subsequent publishes detect independent edits to managed files and show the divergence before allowing a replacement.
- A branch change during review requires a refreshed preview. Dismissing a review leaves both sides intact. If a response is lost, refreshing should distinguish a committed update from a retryable failure.
- The repository can hold a versioned ZMK Customizer project so a builder can reopen it and continue editing the schematic and bindings. Opening a remote project requires explicit confirmation before replacing current work. Existing handwritten ZMK repositories can serve as destinations. Their source files alone are insufficient to reconstruct a ZMK Customizer schematic.

### Follow and download a build

After publication, a builder sees the commit and the status of its GitHub Actions build. A completed build links to its artifacts. A failed or cancelled build links to its run, and the builder can still inspect the saved commit.

- A new repository receives the existing pinned ZMK workflow. An existing workflow is preserved unless the builder explicitly chooses to replace it.
- Status is associated with the exact published commit. While GitHub has yet to start a run, the UI shows that it is waiting and allows a refresh. A disabled or missing workflow gets a link to the repository’s Actions settings.

## Functional requirements

- **FR-001** Export must present repository setup, connected destination, review, publication feedback and build status. Controls must work by keyboard and fit the existing light and dark themes at narrow and wide widths. Progress and errors must be announced. Review dismissal restores focus to its trigger.
- **FR-002** GitHub credentials must remain separate from project data and ZIP exports. Use a GitHub App and a stateless authorization service.
- **FR-003** The user must choose the repository and branch before a write. A single atomic commit must use the branch revision shown in the preview. Unrelated paths and branch history must be preserved.
- **FR-004** Publication must reuse validated deterministic ZMK v0.3 output and the existing project format. ZIP download, offline editing and Undo/Redo must keep working.
- **FR-005** The user must be able to reopen a validated remote project, see the last published commit and open its build run and artifacts.
- **FR-006** Export help and onboarding copy must describe the new GitHub option where they introduce Export. The onboarding exercise continues to complete with ZIP download.

## Success criteria

- **SC-001** A builder can publish a valid project to a new repository and reach the artifacts for the resulting commit after a successful build.
- **SC-002** A builder can connect an existing branch, reopen a previously published project, edit it and publish one new commit while preserving a separately maintained file.
- **SC-003** A simultaneous branch update prevents a stale commit. A cancelled or rejected publication leaves the local project and remote branch recoverable.

## Reference

Keymap Editor uses a GitHub App to write keymap changes to the user's repository and GitHub Actions to build firmware. Its deployed client connects to a dedicated integration API. [Keymap Editor](https://github.com/nickcoutsos/keymap-editor) · [GitHub App](https://github.com/apps/keymap-editor)

The editor is offline-first. GitHub App web authorization uses a separate service for the confidential token exchange. [Existing ADR](../../docs/decisions/0001-static-spa-no-backend.md) · [GitHub App authorization](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
