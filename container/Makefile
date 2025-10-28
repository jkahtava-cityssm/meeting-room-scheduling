
export



CONTAINER_MANAGER=podman

MIGRATE_COMPOSE=$(CONTAINER_MANAGER) compose  -f docker-compose.db.migrate.yml --env-file ../.env


COMPOSE=$(CONTAINER_MANAGER) compose  -f docker-compose.yml --env-file ../.env

CERTBOT_VOLUME=./certbot
DUCKDNS_SCRIPT=./duckdns/update.sh

<<<<<<< HEAD
=======

>>>>>>> feafc5e90a5220061710e23e4a3d72cad9719896
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

<<<<<<< HEAD
=======
up-db:
	$(COMPOSE) up -d postgres


>>>>>>> feafc5e90a5220061710e23e4a3d72cad9719896
#
build: build-db build-nginx build-certbot build-nextjs

build-nginx:
	$(COMPOSE) build nginx

<<<<<<< HEAD
=======
up-nginx:
	$(COMPOSE) up -d nginx

>>>>>>> feafc5e90a5220061710e23e4a3d72cad9719896
build-nextjs:
	$(COMPOSE) build nextjs-app

up-nextjs:
	$(COMPOSE) up -d nextjs-app

build-certbot:
	$(COMPOSE) build certbot

<<<<<<< HEAD
up-db:
	docker-compose up -d postgres

up-nextjs:
	docker-compose up -d nextjs-app

up-nginx:
	docker-compose up -d nginx

up: up-db up-nginx up-nextjs


=======
>>>>>>> feafc5e90a5220061710e23e4a3d72cad9719896


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

<<<<<<< HEAD
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
=======

restart-nginx:
	$(COMPOSE) restart nginx

restart-app:
>>>>>>> feafc5e90a5220061710e23e4a3d72cad9719896
	$(COMPOSE) restart nextjs-app

