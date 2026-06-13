#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if docker compose version >/dev/null 2>&1; then
	exec docker compose -f compose.yml logs -f --tail=200 "$@"
fi

exec docker-compose -f compose.yml logs -f --tail=200 "$@"
