# 0005. Docker for dev and prod, Makefile for non-Node commands

Status: Accepted
Date: 2026-09-27

## Context
Contributors and agents run on different hosts and Node versions. CI must run exactly what developers run. The product is static files, so production needs only a web server.

## Decision
- Dev: `docker compose` runs the Vite dev server on Node 24 (`make up`, http://localhost:5173).
- Prod: multi-stage `Dockerfile` builds `dist/` and serves it with nginx (`make image`, `make prod`, http://localhost:8080).
- Node tasks are npm scripts; everything else (containers, cleanup, release helpers) is a `make` target. `make check` runs the CI checks inside the container.

## Consequences
- Host Node version does not matter; Docker is required.
- `node_modules/` installed in the container may not run on the host; host-side tools (editor integrations, Claude hooks) must degrade gracefully.
- One command list to document: AGENTS.md §5.
