# Repository map

```
AGENTS.md              entry point with explicit mandatory documentation imports
CLAUDE.md              imports AGENTS.md for Claude Code
docs/
  guidelines/          mandatory code-quality rules
  zmk/                 verified ZMK reference notes with links
  roadmap.md           feature list in implementation order
  decisions/           ADRs (index in docs/decisions/README.md)
specs/                 Spec Kit feature specs (created by /speckit-specify)
.specify/              Spec Kit templates, scripts, constitution
.claude/               Claude Code settings, hooks/format-lint.sh (PostToolUse on Edit|Write), agents/ (zmk-reviewer, domain-test-writer, spec-reviewer), skills/ (/speckit-* commands), rules/ (symlinks to docs/guidelines)
src/                   application code (docs/architecture.md)
tests/fixtures/        upstream/ (verbatim ZMK shields, SHA-pinned), project/ and schematic/ (project JSON); expected generator output lands here with the generators
tests/helpers/         shared test builders
scripts/               architecture/guideline checks and mutation runners
infra/                 Dockerfiles, Compose, nginx and pinned ZMK build infrastructure
Makefile               root command entry point
.github/workflows/ci.yml
package.json, tsconfig.json, vite.config.ts, index.html, .oxlintrc.json, .oxfmtrc.json
```
