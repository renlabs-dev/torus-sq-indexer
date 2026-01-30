#!/bin/bash
set -e

# Load PostgreSQL extensions needed by SubQuery
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS btree_gist;
EOSQL

echo "PostgreSQL extensions loaded successfully"
