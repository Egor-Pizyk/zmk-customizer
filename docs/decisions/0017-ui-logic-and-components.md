# ADR 0017: Separate UI logic and React components

Status: Accepted
Date: 2026-10-14

## Context
The user requested separate folders for .ts logic and .tsx interfaces in every mixed module, including nested responsibility groups.

## Decision
A UI group with both implementation extensions is split into logic/ (.ts functions, hooks and contracts) and components/ (.tsx React rendering). Each child exposes explicit named exports through index.ts and an exact alias. Index files are the extension exception. Remove empty parent APIs; consumers import the owning child. Pure groups retain their existing structure.
Keep application state and contexts as logic contracts when components consume them; provider rendering depends on those contracts. Preserve the resolved layer matrix, its single export generator bridge and import/no-cycle. Mirror individual unit tests under the relocated source groups.

## Consequences
Modules separate logic from JSX without changing product behavior. Source inventory checks reject mixed folders and misplaced extensions in logic/components. Existing integration and production browser contracts validate the refactor.
