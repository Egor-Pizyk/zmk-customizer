# Plan

Move infrastructure and update callers, CI cache inputs and documentation. Dockerfile-specific ignore files keep the build context exclusions while living in infra.
Expose explicit indexes for nested domain/generator/UI groups. Resolve module ownership by the longest matching root, migrate imports by symbol ownership, retain named export tracing and enforce group boundaries.
Extract AGENTS sections into product, domain, architecture, tooling, workflow, principles and agent-rules docs; move browser testing rules into docs/testing.md. Import every guideline and ADR explicitly; specs/README.md links feature directories for on-demand loading.
No user behavior changes: reuse all existing Vitest/golden and production Playwright coverage; no new E2E scenarios needed. Add tooling contracts for nested ownership and private/self imports.

## API dependency adjustments

Separate binding/wire/wiring editing and pointer transforms from query modules. Net derivation lives under wires/nets; matrix derivation under wiring/matrix; complete shield validation composes lower validators. Schematic formatting has its own module. These moves eliminate barrel cycles without relaxing import/no-cycle or the resolved architecture gate. Mirror relocated contracts in tests/unit; update mutation runner paths and Vite SSR tooling entry points.
