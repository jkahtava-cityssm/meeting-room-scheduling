#!/bin/sh

echo "Startup script is running"

echo "SERVER_NAME is: $SERVER_NAME"

CERT_PATH="/etc/letsencrypt/live/${SERVER_NAME}/fullchain.pem"

echo "Startup script is running"

if [ ! -f "$CERT_PATH" ]; then
  echo "No cert found — starting Nginx with HTTP-only config"
  envsubst '${SERVER_NAME}' < /etc/nginx/http-only.conf.template > /etc/nginx/conf.d/default.conf
else
  echo "Cert found — starting Nginx with full HTTPS config"
  envsubst '${SERVER_NAME}' < /etc/nginx/full.conf.template > /etc/nginx/conf.d/default.conf
fi

# Always copy the loader
cp /etc/nginx/nginx.conf.template /etc/nginx/nginx.conf

nginx -g 'daemon off;'