#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

require_root() {
	if [ "$(id -u)" -ne 0 ]; then
		echo "Run this as root on the server." >&2
		exit 1
	fi
}

install_docker_if_needed() {
	if command -v docker >/dev/null 2>&1 \
		&& { docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1; }; then
		return
	fi

	if ! command -v apt-get >/dev/null 2>&1; then
		echo "Docker Compose is missing and this script only bootstraps apt-based hosts." >&2
		exit 1
	fi

	apt-get update
	apt-get install -y ca-certificates curl openssl docker.io
	apt-get install -y docker-compose-v2 \
		|| apt-get install -y docker-compose-plugin \
		|| apt-get install -y docker-compose
}

compose() {
	if docker compose version >/dev/null 2>&1; then
		docker compose -f compose.yml "$@"
	else
		docker-compose -f compose.yml "$@"
	fi
}

write_env_if_missing() {
	if [ -f .env ]; then
		return
	fi

	umask 077
	local password
	password="$(openssl rand -hex 32)"
	cat > .env <<EOF
POSTGRES_PASSWORD=${password}
TORUS_RPC_URL=wss://archive.torus.network
TORUS_SYNC_CONCURRENCY=96
TORUS_RESCAN_INTERVAL=10000
RUST_LOG=torus_indexer=info
VITE_INDEXER_API_URL=
COMPOSE_PROJECT_NAME=torus_explorer
EOF
}

upgrade_generated_defaults() {
	if [ ! -f .env ]; then
		return
	fi

	if grep -qx 'TORUS_SYNC_CONCURRENCY=32' .env; then
		sed -i 's/^TORUS_SYNC_CONCURRENCY=32$/TORUS_SYNC_CONCURRENCY=96/' .env
	fi
}

stop_host_caddy_if_present() {
	if systemctl list-unit-files caddy.service >/dev/null 2>&1; then
		systemctl disable --now caddy >/dev/null 2>&1 || true
	fi
}

wait_for_http() {
	local url="$1"
	local label="$2"

	for _ in $(seq 1 90); do
		if curl -fsS "$url" >/dev/null 2>&1; then
			echo "${label} ok"
			return
		fi
		sleep 2
	done

	echo "${label} did not become ready; recent logs:" >&2
	compose ps >&2 || true
	compose logs --tail=120 >&2 || true
	exit 1
}

require_root
install_docker_if_needed
systemctl enable --now docker
stop_host_caddy_if_present
write_env_if_missing
upgrade_generated_defaults

compose up -d --build
wait_for_http http://127.0.0.1/health "indexer health"
wait_for_http http://127.0.0.1/ "explorer"

compose ps
curl -fsS http://127.0.0.1/v1/status || true
printf '\n\nDeployed. Follow logs with: ./deploy/logs.sh\n'
