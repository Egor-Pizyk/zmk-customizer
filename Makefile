.DEFAULT_GOAL := help
.PHONY: help up down logs sh install check test-mutations image prod clean

RUN := docker compose run --rm app

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-10s %s\n", $$1, $$2}'

up: ## Start dev server in Docker (http://localhost:5173)
	docker compose up -d --build app

down: ## Stop containers
	docker compose --profile prod down

logs: ## Follow dev server logs
	docker compose logs -f app

sh: ## Shell inside the app container
	$(RUN) sh

install: ## npm ci inside the container
	$(RUN) npm ci

check: ## agents sync + typecheck + lint + format check + tests (same as CI)
	$(RUN) npm run check

test-mutations: ## Verify tests catch seeded business regressions (run alone)
	python3 scripts/check-test-mutations.py

image: ## Build production image (nginx serving dist/)
	docker compose --profile prod build prod

prod: ## Run production image locally (http://localhost:8080)
	docker compose --profile prod up -d prod

clean: ## Remove dist/, coverage, containers, volumes
	docker compose --profile prod down -v --remove-orphans
	rm -rf dist coverage
