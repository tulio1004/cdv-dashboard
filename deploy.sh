#!/usr/bin/env bash
set -e
docker compose --env-file .env up -d --build
docker image prune -f
echo "Deploy OK"
