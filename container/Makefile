export

CONTAINER_MANAGER=podman
ENV_FILE_LOCATION=../.env
MIGRATE_COMPOSE=$(CONTAINER_MANAGER) compose -f docker-compose.db.migrate.yml --env-file ${ENV_FILE_LOCATION}
COMPOSE=$(CONTAINER_MANAGER) compose -f local.docker-compose.merged.yml --env-file ${ENV_FILE_LOCATION}

.PHONY: init dev app migrate seed cert-init cert-renew down logs

# Production bootstrap (DB + migrate + app stack)
init:
	$(COMPOSE) --profile init up -d --rm prisma-migrate

# Development bootstrap (DB + migrate + seed + app stack)
dev:
	$(COMPOSE) --profile dev up -d --build

# App stack only (no migrations/seed)
app:
	$(COMPOSE) --profile app up -d

# Run migrations only (one-off)
migrate:
	$(COMPOSE) --profile migrate run --rm prisma-migrate

# Run seed only (one-off)
seed:
	$(COMPOSE) --profile seed run --rm prisma-seed

# Obtain initial certificates
cert-init:
	$(COMPOSE) --profile cert-init run --rm cert-init

# Start certbot renewal daemon (depends on duckdns-updater)
cert-renew:
	$(COMPOSE) --profile cert-renew up -d

# Stop everything
down:
	$(COMPOSE) down

# Tail logs
logs:
	$(COMPOSE) logs -f
