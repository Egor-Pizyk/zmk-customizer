# Tech stack

| Area | Choice | Notes |
|---|---|---|
| Language | TypeScript 7, `strict` + extra flags incl. `erasableSyntaxOnly` (no enums/namespaces), see `tsconfig.json` | No `any`, no non-null `!`, no `as` (only `as const`; zod parsing yields typed values) |
| Runtime | Node 24 (inside Docker) | Only for tooling; the product is static files |
| Package manager | npm | `package-lock.json` is committed |
| Build/dev | Vite | Output: `dist/`, deployable to any static host |
| UI | React 19 | Function components only; rules in `docs/guidelines/frontend/` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` ([ADR 0011](decisions/0011-tailwind-design-system.md)) | Semantic tokens in `src/styles.css` `@theme`; no raw palette / arbitrary values in feature code |
| Lint | oxlint, type-aware via `oxlint-tsgolint` (`.oxlintrc.json`); Tailwind rules via `eslint-plugin-better-tailwindcss` loaded as an oxlint `jsPlugin` (alpha API, no ESLint installed) | Lint errors fail CI |
| Format | oxfmt (`.oxfmtrc.json`; sorts Tailwind classes; markdown and fixtures excluded) | Not negotiable in review; run the formatter |
| Tests | Vitest + Playwright | Unit + golden files; React/jsdom for interaction logic; real-browser E2E for user journeys (see docs/testing.md) |
| Containers | Docker + docker compose | Dev server and production image |
| Non-Node commands | `Makefile` | Docker, cleanup, release helpers |
| Spec workflow | GitHub Spec Kit (`/speckit-*` commands in Claude Code) | See docs/workflow.md |

Approved runtime dependencies (add only when the first feature needs them):

- `react`, `react-dom`
- `zod` — validating imported JSON / localStorage (trust boundary)
- `fflate` — building the download `.zip`

Anything else needs a line in `docs/decisions/` explaining why a few lines of our own code are not enough. Prefer browser APIs: SVG for the canvas, `<dialog>`, `<details>`, `URL.createObjectURL` for downloads, CSS for layout.

## Local UI/UX skill

[UI/UX Pro Max](../.agents/skills/ui-ux-pro-max/SKILL.md) is vendored in
`.agents/skills/ui-ux-pro-max/` for this project only.
Invoke `$ui-ux-pro-max` in Codex.
Its local search needs Python 3 (standard library only); it adds no application dependency.
[Installation provenance and update notes](../.agents/skills/ui-ux-pro-max/INSTALLATION.md)
record the pinned upstream revision, license and local adaptation.
Search recommendations remain subject to repository rules and existing design tokens.
The planned audit/specification and separate fixes are roadmap steps 035 and 036.
