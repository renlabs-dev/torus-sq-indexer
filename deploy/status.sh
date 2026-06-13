#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

compose() {
	if docker compose version >/dev/null 2>&1; then
		docker compose -f compose.yml "$@"
	else
		docker-compose -f compose.yml "$@"
	fi
}

compose ps
printf '\nhealth:\n'
curl -fsS http://127.0.0.1/health || true
printf '\n\nstatus:\n'
curl -fsS http://127.0.0.1/v1/status || true
printf '\n\nindexer logs:\n'
compose logs --tail=80 indexer
