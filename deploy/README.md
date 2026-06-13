# Torus Explorer Deploy

One Docker Compose project:

- `postgres`: persistent indexer database in the `postgres-data` Docker volume
- `indexer`: Rust sync/API process
- `web`: Caddy serving the built explorer and proxying `/v1/*` to the indexer

Run from the server after rsync:

```sh
cd /root/explorer/torus-sq-indexer
chmod +x deploy/*.sh
./deploy/up.sh
```

Check it:

```sh
./deploy/status.sh
./deploy/logs.sh
```

The deploy script creates `deploy/.env` on first run and keeps the database
password stable across later runs. Do not commit or copy that file back to your
laptop.
