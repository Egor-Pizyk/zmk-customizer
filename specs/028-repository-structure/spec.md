# Repository structure and agent context

## Requirements
- Keep Docker, Compose, nginx and the pinned ZMK build runner in `infra/`; root Makefile commands and CI must continue working.
- Remove OpenCode configuration, integration files and synchronization requirements.
- Give existing responsibility groups their own explicit public indexes and exact aliases; consumers use the owning group API. Preserve architecture restrictions and application behavior.
- Keep AGENTS.md small with explicit mandatory documentation imports, all guidelines and ADRs read at startup, and an on-demand feature directory index instead of importing specs.
- Preserve all existing product, domain, testing and contributor rules in dedicated documentation.

## Acceptance
Existing check, production build and browser journeys pass. Docker configurations resolve with the repository root as context and mount source. No new user journey, schema, generated firmware content or dependency is introduced.
