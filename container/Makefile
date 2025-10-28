
export



CONTAINER_MANAGER=docker

MIGRATE_COMPOSE=$(CONTAINER_MANAGER) compose  -f docker-compose.db.migrate.yml --env-file ../.env


COMPOSE=$(CONTAINER_MANAGER) compose  -f docker-compose.yml --env-file ../.env

CERTBOT_VOLUME=./certbot
DUCKDNS_SCRIPT=./duckdns/update.sh

#CREATE DATABASE AND DEPLOY DATABASE
init: build up cert-init restart-nginx
start: up cert-init restart-nginx
stop: down
#CREATE & SEED
create-seed: build-db up-db build-migrate up-migrate up-seed rm-migrate

#CREATE BLANK DATABASE
create: build-db up-db build-migrate up-migrate rm-migrate

up: up-db up-nginx up-nextjs

init: create build up cert-init restart-nginx
start: up cert-init restart-nginx


build-migrate: 
	$(MIGRATE_COMPOSE) build prisma-migrate 
	    
up-migrate:
	$(MIGRATE_COMPOSE) run --rm prisma-migrate /bin/sh -c "npx prisma migrate deploy"

up-seed:
	$(MIGRATE_COMPOSE) run --rm prisma-migrate /bin/sh -c "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"

rm-migrate:
	$(CONTAINER_MANAGER) image rm prisma-migrate

build-db:
	$(COMPOSE) build postgres	

up-db:
	$(COMPOSE) up -d postgres


#
build: build-db build-nginx build-certbot build-nextjs

build-nginx:
	$(COMPOSE) build nginx

up-nginx:
	$(COMPOSE) up -d nginx

build-nextjs:
	$(COMPOSE) build nextjs-app

up-nextjs:
	$(COMPOSE) up -d nextjs-app

build-certbot:
	$(COMPOSE) build certbot



reset:
	$(COMPOSE) down -v --remove-orphans
	rm -rf $(CERTBOT_VOLUME)/conf
	rm -rf $(CERTBOT_VOLUME)/www
	$(CONTAINER_MANAGER) volume rm container_postgres_data || true
	make setup


#  Stop all services
down:
	$(COMPOSE) down

# View logs
logs:
	$(COMPOSE) logs -f

# Request initial SSL certificate
cert-init:
	$(CONTAINER_MANAGER) run --rm \
		-v $(CERTBOT_VOLUME)/www:/var/www/certbot \
		-v $(CERTBOT_VOLUME)/conf:/etc/letsencrypt \
		certbot/certbot certonly \
		--webroot -w /var/www/certbot \
		--keep-until-expiring \
		--email ${EMAIL} \
		--agree-tos \
		--no-eff-email \
		-d ${DUCKDNS_DOMAIN}

#  Manually renew SSL certificate
cert-renew:
	$(CONTAINER_MANAGER) run --rm \
		-v $(CERTBOT_VOLUME)/www:/var/www/certbot \
		-v $(CERTBOT_VOLUME)/conf:/etc/letsencrypt \
		certbot/certbot renew --webroot -w /var/www/certbot


restart-nginx:
	$(COMPOSE) restart nginx

restart-app:
	$(COMPOSE) restart nextjs-app

