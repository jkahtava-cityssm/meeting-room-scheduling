include ../.env
export

COMPOSE=docker-compose -f docker-compose.yml
MIGRATE_COMPOSE=docker-compose -f docker-compose.migrate.yml
CERTBOT_VOLUME=./certbot
DUCKDNS_SCRIPT=./duckdns/update.sh

#  First-time setup
#init: setup build up wait-postgres migrate wait-nginx cert-init restart-app restart-nginx
#init: setup up wait-postgres migrate build restart-app wait-nginx cert-init restart-nginx
#init: setup up-db wait-postgres build up-app seed wait-nginx cert-init restart-nginx






#CREATE DATABASE AND DEPLOY DATABASE

#CREATE & SEED
create-seed: build-db up-db build-migrate up-migrate up-seed rm-migrate

#CREATE BLANK DATABASE
create: build-db up-db build-migrate up-migrate rm-migrate

build-migrate: 
	docker-compose build prisma-migrate
	    
up-migrate:
	docker compose run --rm prisma-migrate /bin/sh -c "npx prisma migrate deploy"

up-seed:
	docker compose run --rm prisma-migrate /bin/sh -c "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"

rm-migrate:
	docker image rm prisma-migrate

build-db:
	docker-compose build postgres	

up-db:
	docker-compose up -d postgres


#
build: build-db build-nginx build-certbot build-nextjs

build-nginx:
	docker-compose build nginx

up-nginx:
	docker-compose up -d nginx

build-nextjs:
	docker-compose build nextjs-app

build-certbot:
	docker-compose build certbot

up: up-db up-nginx up-nextjs


init: build up cert-init restart-nginx
start: up cert-init restart-nginx


reset:
	$(COMPOSE) down -v --remove-orphans
	rm -rf $(CERTBOT_VOLUME)/conf
	rm -rf $(CERTBOT_VOLUME)/www
	docker volume rm container_postgres_data || true
	make setup

#  Deploy stack (production-grade launch)
deploy: setup cert-renew build up

#  Make DuckDNS script executable
setup:
	chmod +x ./duckdns/update.sh
	chmod +x ./scripts/wait-postgres.sh

#  Start all services
#up:
#	$(COMPOSE) up -d

#  Stop all services
down:
	$(COMPOSE) down

#  Rebuild containers
#build:
#	$(COMPOSE) build

# View logs
logs:
	$(COMPOSE) logs -f

# Request initial SSL certificate
cert-init:
	docker run --rm \
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
	docker run --rm \
		-v $(CERTBOT_VOLUME)/www:/var/www/certbot \
		-v $(CERTBOT_VOLUME)/conf:/etc/letsencrypt \
		certbot/certbot renew --webroot -w /var/www/certbot

wait-nginx:
	@echo "Waiting for Nginx to be ready..."
	@until curl -s http://localhost/.well-known/acme-challenge/ || [ $$? -eq 0 ]; do \
		echo "Nginx not ready yet..."; \
		sleep 2; \
	done
	@echo "Nginx is ready to serve Certbot challenge."


up-app:
	docker-compose up -d nextjs-app nginx duckdns-updater certbot


wait-postgres:
	sh ./scripts/wait-postgres.sh


migrate:
	docker-compose run --rm prisma-migrate

restart-nginx:
	$(COMPOSE) restart nginx


#  Manually update DuckDNS IP
duckdns-update:
	sh $(DUCKDNS_SCRIPT)

#  Prisma seed manually
seed:
	docker exec -it container-prisma-migrate-1 sh -c " npx prisma db seed"

#  Restart Next.js app only
restart-app:
	$(COMPOSE) restart nextjs-app
