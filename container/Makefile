export

# Default environment is 'dev' if not specified
ENV ?= dev
CONTAINER_MANAGER=podman
COMPOSE=$(CONTAINER_MANAGER) compose -f docker-compose.yml --env-file .env.${ENV}

.PHONY: init install installApp installMigrate installSeed

init:
	$(COMPOSE) --profile init up -d 

install:
	$(COMPOSE) --profile install-db build --build-arg BUILD_ENV=${ENV} --no-cache
	$(COMPOSE) --profile install-db up -d
	$(COMPOSE) --profile install-nginx build --build-arg BUILD_ENV=${ENV} --no-cache
	$(COMPOSE) --profile install-nginx up -d
	$(COMPOSE) --profile install-app build --build-arg BUILD_ENV=${ENV} --no-cache
	$(COMPOSE) --profile install-app up -d
	podman image prune -f


installMigrate:
	$(COMPOSE) --profile install-db build --build-arg BUILD_ENV=${ENV} --no-cache
	$(COMPOSE) --profile install-db up -d
	podman image prune -f

installApp:
	$(COMPOSE) --profile install-app build --build-arg BUILD_ENV=${ENV} --no-cache	
	$(COMPOSE) --profile install-app up -d
	podman image prune -f

installSeed:
	$(COMPOSE) --profile seed build --build-arg BUILD_ENV=${ENV} --no-cache	
	$(COMPOSE) --profile seed up -d
	podman image prune -f

