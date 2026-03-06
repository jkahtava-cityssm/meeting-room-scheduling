
#!/bin/sh
set -eu

echo "Startup script is running"

# Self-signed certificate metadata (used for generation)
CERT_DAYS="${CERT_DAYS:-365}"
CERT_COUNTRY="${CERT_COUNTRY:-CA}"
CERT_STATE="${CERT_STATE:-Ontario}"
CERT_LOCALITY="${CERT_LOCALITY:-Sault Ste. Marie}"
CERT_ORG="${CERT_ORG:-Dev}"
CERT_OU="${CERT_OU:-IT}"

# SANs for the cert; first entry becomes CN.
# Prefer your DuckDNS domain if provided; otherwise dev-friendly defaults.
if [ -n "${SERVER_NAME:-}" ]; then
  DOMAINS="${DOMAINS:-$SERVER_NAME,localhost,127.0.0.1}"
else
  DOMAINS="${DOMAINS:-localhost,127.0.0.1}"
fi

CERT_DIR="/etc/nginx/certs"
KEY_PATH="${CERT_DIR}/selfsigned.key"
CRT_PATH="${CERT_DIR}/selfsigned.crt"
DHPARAM_PATH="${CERT_DIR}/dhparam.pem"

mkdir -p "${CERT_DIR}"

# Build subjectAltName string from DOMAINS (handles IP and DNS)
OLD_IFS="$IFS"
IFS=","
set -- $DOMAINS
IFS="$OLD_IFS"

SAN_LIST=""
FIRST_CN=""
for d in "$@"; do
  # Trim spaces
  d_trim="$(echo "$d" | sed 's/^ *//; s/ *$//')"
  [ -z "$d_trim" ] && continue

  # Detect IP vs DNS
  case "$d_trim" in
    [0-9][0-9]*.[0-9][0-9]*.[0-9][0-9]*.[0-9][0-9]*)
      type="IP"
      ;;
    *)
      type="DNS"
      ;;
  esac

  if [ -z "$SAN_LIST" ]; then
    SAN_LIST="$type:$d_trim"
    FIRST_CN="$d_trim"
  else
    SAN_LIST="$SAN_LIST,$type:$d_trim"
  fi
done

[ -z "$FIRST_CN" ] && FIRST_CN="localhost"

# Try to ensure cert exists; if not, attempt generation
ensure_cert() {
  if [ ! -f "$CRT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo "No cert found — attempting to generate a self-signed certificate"
    echo "  CN: $FIRST_CN"
    echo "  SANs: $SAN_LIST"

    # Attempt generation
    if openssl req -x509 -newkey rsa:2048 -nodes \
      -keyout "$KEY_PATH" \
      -out "$CRT_PATH" \
      -days "$CERT_DAYS" \
      -subj "/C=$CERT_COUNTRY/ST=$CERT_STATE/L=$CERT_LOCALITY/O=$CERT_ORG/OU=$CERT_OU/CN=$FIRST_CN" \
      -addext "subjectAltName=$SAN_LIST"; then
      chmod 600 "$KEY_PATH"
      chmod 644 "$CRT_PATH"
      echo "Self-signed certificate generated."
    else
      echo "WARNING: Certificate generation failed."
    fi
  fi

  # DH params are required for HTTPS
  if [ -f "$CRT_PATH" ] && [ -f "$KEY_PATH" ] && [ ! -f "$DHPARAM_PATH" ]; then
    echo "Generating DH parameters (this may take a while)..."
    if ! openssl dhparam -out "$DHPARAM_PATH" 2048; then
      echo "WARNING: DH parameter generation failed."
    fi
  fi
}

ensure_cert

if [ ! -f "$CRT_PATH" ]; then
  echo "No cert found — starting Nginx with HTTP-only config"
  envsubst '${SERVER_NAME}' < /etc/nginx/http-only.conf.template > /etc/nginx/conf.d/default.conf
else
  echo "Cert found — starting Nginx with full HTTPS config"
  envsubst '${SERVER_NAME}' < /etc/nginx/full.conf.template > /etc/nginx/conf.d/default.conf
fi

cp /etc/nginx/nginx.conf.template /etc/nginx/nginx.conf

nginx -g 'daemon off;'
