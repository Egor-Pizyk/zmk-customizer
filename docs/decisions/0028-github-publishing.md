# 0028. Optional GitHub publishing

Status: Accepted

The editor ships as static files. Editing, autosave, project import and ZIP export work without network access. Configured deployments can optionally connect a GitHub App, publish to a branch and follow GitHub Actions builds.

A separate Node service exchanges one-time GitHub authorization codes. The server holds the client secret, accepts one configured browser origin and callback, and stores no account, project or session data. The browser checks the OAuth state and uses PKCE. It holds the GitHub user access token in memory and communicates directly with the GitHub API. The service never receives firmware files.

Publication uses the existing pinned export and versioned project JSON. The domain compares generated files to a Git tree. GitHub writes exactly the reviewed file changes in a commit conditional on the reviewed branch head. Credentials and repository selection are outside Project and its undo history. There are no new runtime dependencies.

This partially supersedes [ADR 0001](0001-static-spa-no-backend.md). See [deployment and usage](../github.md).
