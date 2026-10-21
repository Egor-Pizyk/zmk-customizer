# Implementation Plan: Build verification

Branch: 023-build-verification. Scope: roadmap 023 / audit 024 A09.

Existing Node 24/Vite SSR tooling generates repository files into .zmk-build/exports. Docker official zmk-build-arm 3.5 image pinned by multi-architecture digest uses Zephyr SDK 0.16.3 and west 1.2.0. A separate isolated workspace uses pinned ZMK commit and frozen west dependency manifest. Host Makefile owns generation/build commands; shell build runner executes west, records logs/config/DTS/firmware, and requires intended negative connector failure. As requested by the owner on 2026-10-21, firmware verification is local-only via make zmk-build; no CI job or required GitHub status remains. Local pinned tooling, workspace reuse and artifact paths stay unchanged.

Constitution before/after design: PASS. Static product unchanged, generators pure/deterministic, tests/golden preserved, dependency direction unchanged. No new runtime dependencies. Existing pinned docs consulted before build code.
