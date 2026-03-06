#!/bin/sh
echo "Updating DuckDNS IP..."
curl -s "https://www.duckdns.org/update?domains=${SERVER_NAME}&token=${DUCKDNS_TOKEN}&ip="
