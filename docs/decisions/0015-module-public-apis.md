# ADR 0015: Module public APIs and exact import aliases

Status: Superseded by 0016. Date: 2026-10-13.

The user requested module indexes, shorter aliased imports and lint enforcement of public entry points. This supersedes the earlier no-barrel rule. Modules expose explicit named value and type exports in index.ts. Exact compilerOptions.paths aliases point to these entries; there are no wildcard aliases to private source files.

Within each module, direct relative imports remain allowed and self-barrel imports are rejected. Existing responsibility groups in domain and generators have mutual dependencies at folder granularity, so those layers expose a single module API while retaining the smaller internal folders. Independent catalog/storage groups and UI workspaces/shared areas expose separate APIs. Shared UI contracts are separated from app composition; issue data and shortcut event parsing do not depend on shell rendering or application composition.

Vite uses its built-in [resolve.tsconfigPaths](https://vite.dev/config/shared-options#resolve-tsconfigpaths), so no dependency or duplicated runtime alias table is needed. The repository adds an [Oxlint JS rule](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins) using the already approved JS plugin mechanism. modules/public-api rejects deep aliases, direct cross-module imports and self-barrel imports, including imports in tests, re-exports and dynamic imports. CSS, raw pinned assets and test fixtures retain ordinary file paths.

The resolved architecture gate follows the imported names through public re-exports to their defining files, retaining the layer matrix, type-only restrictions, low-level electrical API restrictions and the single runtime UI-to-generator bridge. Public indexes do not grant blanket permission to a layer. import/no-cycle remains enabled. Pure re-export indexes are excluded from behavioral coverage; unchanged global and per-layer coverage floors apply to their implementations. Existing unit/golden and production browser contracts validate runtime behavior.
