# List available recipes.
default:
    @just --list

pgdata := ".local/pg"
pgport := "55432"

# Format Rust and Nix.
fmt:
    cargo fmt
    nixpkgs-fmt flake.nix

# Strict checks: format, clippy, tests.
check:
    cargo fmt --check
    cargo clippy --all-targets -- -D warnings
    cargo test

# Initialize the local dev Postgres. Run once.
db-init:
    initdb -D {{ pgdata }} -U postgres --auth=trust --no-locale -E UTF8
    just db-start
    createdb -h 127.0.0.1 -p {{ pgport }} -U postgres torus_indexer

# Start the local dev Postgres.
db-start:
    pg_ctl -D {{ pgdata }} -o "-h 127.0.0.1 -p {{ pgport }} -k /tmp" -l {{ pgdata }}/postgres.log start

# Stop the local dev Postgres.
db-stop:
    pg_ctl -D {{ pgdata }} stop

# psql into the local dev database.
psql *args:
    psql -h 127.0.0.1 -p {{ pgport }} -U postgres torus_indexer {{ args }}

# Run the indexer (sync + API in one process) against $DATABASE_URL.
run *args:
    cargo run -- {{ args }}

# Run the explorer against a local indexer API.
explorer-dev api="http://127.0.0.1:8080":
    cd ref/torus-explorer && VITE_INDEXER_API_URL={{ api }} npm run dev
