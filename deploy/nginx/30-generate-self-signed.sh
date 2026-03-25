#!/bin/sh
set -eu

DOMAIN="${SITE_DOMAIN:-localhost}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
FULLCHAIN="${CERT_DIR}/fullchain.pem"
PRIVKEY="${CERT_DIR}/privkey.pem"

if [ ! -f "${FULLCHAIN}" ] || [ ! -f "${PRIVKEY}" ]; then
  echo "[nginx] No Let's Encrypt cert found for ${DOMAIN}, generating temporary self-signed certificate..."
  mkdir -p "${CERT_DIR}"
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "${PRIVKEY}" \
    -out "${FULLCHAIN}" \
    -days 7 \
    -subj "/CN=${DOMAIN}"
fi
