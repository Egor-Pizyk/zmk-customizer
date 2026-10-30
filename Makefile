.DEFAULT_GOAL := help
.PHONY: help up down logs sh install check test-mutations image prod clean zmk-build test-e2e test-e2e-mutations

RUN := docker compose -p zmk-customizer -f infra/compose.yaml run --rm app

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-10s %s\n", $$1, $$2}'

up: ## Start dev server in Docker (http://localhost:5173)
	docker compose -p zmk-customizer -f infra/compose.yaml up -d --build app

down: ## Stop containers
	docker compose -p zmk-customizer -f infra/compose.yaml --profile prod down

logs: ## Follow dev server logs
	docker compose -p zmk-customizer -f infra/compose.yaml logs -f app

sh: ## Shell inside the app container
	$(RUN) sh

install: ## npm ci and install the staged-check Git hook
	$(RUN) npm ci
	npm run hooks:install

check: ## architecture + types + lint + format (no unit/E2E tests)
	$(RUN) npm run check

test-mutations: ## Verify tests catch seeded business regressions (run alone)
	npm run test:mutations

image: ## Build production image (nginx serving dist/)
	docker compose -p zmk-customizer -f infra/compose.yaml --profile prod build prod

prod: ## Run production image locally (http://localhost:8080)
	docker compose -p zmk-customizer -f infra/compose.yaml --profile prod up -d prod

clean: ## Remove dist/, coverage, containers, volumes
	docker compose -p zmk-customizer -f infra/compose.yaml --profile prod down -v --remove-orphans
	rm -rf dist coverage

zmk-build: ## Compile actual exports in a pinned ZMK v0.3 environment
	$(RUN) node scripts/generate-build-fixtures.mjs
	docker compose -p zmk-customizer --env-file infra/zmk-build.env -f infra/compose.zmk.yaml run --rm zmk-build

test-e2e: ## Run production browser journeys in isolated Chromium/Firefox/WebKit
	docker compose -p zmk-customizer -f infra/compose.e2e.yaml run --build --rm e2e

test-e2e-mutations: ## Verify nine browser regressions (run alone)
	npm run test:e2e:mutations

check-changed: ## Static checks for staged files (exact index snapshot)
	npm run check:changed

.PHONY: test-unit test-unit-changed test-unit-focus

test-unit: ## All application/tooling unit tests at task completion
	$(RUN) npm run test:unit

test-unit-changed: ## Unit tests related to staged changes
	npm run test:unit:changed

test-unit-focus: ## Diagnose a failed unit: make test-unit-focus ARGS='tests/unit/example.test.ts'
	$(RUN) npm run test:unit:focus -- $(ARGS)
