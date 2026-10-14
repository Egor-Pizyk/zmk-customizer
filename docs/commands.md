# Commands

Node-related tasks are npm scripts. Everything else is `make`. Both run inside Docker by default so host Node version does not matter.

```
make up          # start dev server in Docker (http://localhost:5173)
make down        # stop containers
make logs        # follow dev server logs
make sh          # shell inside the app container
make install     # npm ci inside the container (run after dependency changes: node_modules is a Docker volume)
make check       # typecheck + lint + format check + Vitest coverage inside the container
make test-e2e    # production build + Chromium suite + focused Firefox/WebKit checks
make test-e2e-mutations # controlled browser regressions; run alone after make test-e2e
make image       # build production image (nginx serving dist/)
make prod        # run production image locally (http://localhost:8080)
make clean       # remove dist/, coverage, containers, volumes

npm run dev | build | preview
npm run typecheck | lint | lint:fix | format | format:check
npm run test | test:watch
npm run test:e2e | test:e2e:types
npm run check    # static checks + Vitest coverage; browser execution is a separate CI job
```

`make help` lists targets. Before finishing any task: `make check` must pass.

Container definitions and the pinned ZMK runner live in `infra/`; Makefile selects them with explicit paths and the stable `zmk-customizer` Compose project name. Build contexts and app mounts remain at the repository root. Docker ignore rules are Dockerfile-specific files beside the Dockerfiles, so no root `.dockerignore` is needed.

Mutation orchestration uses host Node 24: Makefile delegates to npm run test:mutations / npm run test:e2e:mutations, which launch the test containers through Docker. The application checks and builds continue to run inside Docker.
