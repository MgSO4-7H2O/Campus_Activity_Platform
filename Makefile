# Campus Activity Platform - Docker Compose commands

COMPOSE ?= docker compose

up:
	$(COMPOSE) up -d postgres redis adminer

up-full:
	$(COMPOSE) --profile full up -d

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

test:
	pnpm -r test:run

.PHONY: up up-full down clean logs ps test

