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
| Spec workflow | GitHub Spec Kit 1.2.3 (`/speckit-*` in Claude Code; shared skill adapters for Codex) | Project preset/overrides and upgrade procedure: docs/commands.md |

Approved runtime dependencies (add only when the first feature needs them):

- `react`, `react-dom`
- `zod` — validating imported JSON / localStorage (trust boundary)
- `fflate` — building the download `.zip`

Anything else needs a line in `docs/decisions/` explaining why a few lines of our own code are not enough. Prefer browser APIs: SVG for the canvas, `<dialog>`, `<details>`, `URL.createObjectURL` for downloads, CSS for layout.

Feature 038 additionally approves exact `@joint/core` version `4.3.3` (MPL-2.0) only in `src/ui/schematic/diagram/logic/`, under [ADR0023](decisions/0023-jointjs-schematic-projection.md). The manifest and lockfile pin that exact version; upstream license and source notices live in public/licenses/. No other JointJS package, paid extension or pure-layer import is approved; retain upstream notices and verify offline assets.
