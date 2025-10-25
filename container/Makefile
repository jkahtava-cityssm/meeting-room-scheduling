include ../.env
export

COMPOSE=docker-compose -f docker-compose.yml
MIGRATE_COMPOSE=docker-compose -f docker-compose.migrate.yml
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

#
build: build-db build-nginx build-certbot build-nextjs

build-nginx:
	docker-compose build nginx

build-nextjs:
	docker-compose build nextjs-app

build-certbot:
	docker-compose build certbot

up-db:
	docker-compose up -d postgres

up-nextjs:
	docker-compose up -d nextjs-app

up-nginx:
	docker-compose up -d nginx

up: up-db up-nginx up-nextjs




reset:
	$(COMPOSE) down -v --remove-orphans
	rm -rf $(CERTBOT_VOLUME)/conf
	rm -rf $(CERTBOT_VOLUME)/www
	docker volume rm container_postgres_data || true
	make setup


#  Stop all services
down:
	$(COMPOSE) down

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

rm-cert:
	docker image rm certbot/certbot

start-cert: build-certbot cert-init rm-cert

#  Manually update DuckDNS IP
duckdns-update:
	sh $(DUCKDNS_SCRIPT)

restart-nginx:
	$(COMPOSE) restart nginx

#  Restart Next.js app only
restart-nextjs:
	$(COMPOSE) restart nextjs-app
