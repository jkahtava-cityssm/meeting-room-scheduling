#!/bin/sh

echo "Startup script is running"

echo "DUCKDNS_DOMAIN is: $DUCKDNS_DOMAIN"

CERT_PATH="/etc/letsencrypt/live/${DUCKDNS_DOMAIN}/fullchain.pem"

echo "Startup script is running"

if [ ! -f "$CERT_PATH" ]; then
  echo "No cert found — starting Nginx with HTTP-only config"
  envsubst < /etc/nginx/http-only.conf.template > /etc/nginx/conf.d/default.conf
else
  echo "Cert found — starting Nginx with full HTTPS config"
  envsubst < /etc/nginx/full.conf.template > /etc/nginx/conf.d/default.conf
fi

# Always copy the loader
cp /etc/nginx/nginx.conf.template /etc/nginx/nginx.conf

nginx -g 'daemon off;'