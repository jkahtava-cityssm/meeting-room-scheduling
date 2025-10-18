#!/bin/sh

echo "Waiting for Postgres to be ready..."

while true; do
  docker exec container-postgres pg_isready -U prisma -d meeting_room_scheduling > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "Postgres is ready."
    break
  else
    echo "Still waiting..."
    sleep 2
  fi
done
