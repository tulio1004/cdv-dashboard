#!/bin/sh
set -eu

LE_FULLCHAIN="/etc/letsencrypt/live/dashboard.tuliorafesi.com/fullchain.pem"
LE_PRIVKEY="/etc/letsencrypt/live/dashboard.tuliorafesi.com/privkey.pem"
NGINX_FULLCHAIN="/etc/nginx/certs/fullchain.pem"
NGINX_PRIVKEY="/etc/nginx/certs/privkey.pem"

if [ -f "$LE_FULLCHAIN" ] && [ -f "$LE_PRIVKEY" ]; then
  cp "$LE_FULLCHAIN" "$NGINX_FULLCHAIN"
  cp "$LE_PRIVKEY" "$NGINX_PRIVKEY"
  chmod 644 "$NGINX_FULLCHAIN"
  chmod 600 "$NGINX_PRIVKEY"
else
  if [ ! -f "$NGINX_FULLCHAIN" ] || [ ! -f "$NGINX_PRIVKEY" ]; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "$NGINX_PRIVKEY" \
      -out "$NGINX_FULLCHAIN" \
      -subj "/CN=dashboard.tuliorafesi.com"
    chmod 644 "$NGINX_FULLCHAIN"
    chmod 600 "$NGINX_PRIVKEY"
  fi
fi
