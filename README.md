# torus-indexer

Minimal Torus chain indexer: **transfers and account balances**, nothing else.
One Rust binary (subxt + Postgres + axum) that migrates on boot, syncs finalized
blocks, and serves the read API — all in a single process.

Replaces the legacy SubQuery indexer (archived on branch
`archive/ts-subquery-indexer`).

## How it works

- Finalized blocks are fetched concurrently, committed strictly in order, one
  transaction per block; the resume position lives in `indexer_status`, so the
  process can be killed at any time.
- `Balances.Transfer` events become transfer rows. Every balance change on
  Torus emits a `Balances.*` event (emission rewards included) and stake is a
  named reserve in `System::Account`, so refreshing the accounts mentioned in
  `Balances`/`Torus0` events keeps balances exact. A full `System::Account`
  rescan at the tip (every `TORUS_RESCAN_INTERVAL` blocks) is the safety net
  and picks up genesis allocations.
- Historical blocks decode against the runtime metadata of their spec version
  (upgrade boundaries are bisected once at startup), so a full backfill from
  genesis works across runtime upgrades.
- The 592 Commune bridge migration credits (sender `CommuneBridge`) are
  inserted once from `data/genesis_bridge_transfers.csv` — legacy facts that
  are not derivable from chain events.

Full backfill needs an **archive node** (historical state) and takes a few
hours: ~4 RPC calls per block, ~200 blocks/s against
`wss://archive.torus.network`.

## Run it

```sh
direnv allow      # nix devshell: rust, just, postgres, node
just db-init      # once: local postgres on :55432
just run
```

Config (env or flags):

| var | default |
| --- | --- |
| `DATABASE_URL` | — (required; devshell defaults to the local db) |
| `TORUS_RPC_URL` | `wss://archive.torus.network` |
| `TORUS_INDEXER_BIND` | `0.0.0.0:8080` |
| `TORUS_SYNC_CONCURRENCY` | `96` |
| `TORUS_RESCAN_INTERVAL` | `10000` |

## API

Amounts are planck strings (18 decimals). Lists are `limit`/`offset` paginated
(`limit` ≤ 100) and return `{ "items": [...], "has_more": bool }`.

```
GET /health
GET /v1/status                          → { last_height, target_height }
GET /v1/transfers?address=&limit=&offset=
GET /v1/accounts?limit=&offset=         → ordered by total balance desc
GET /v1/accounts/{address}              → { address, free, staked, total, updated_height }
```

## Deploy

Fast self-host path is in `deploy/`: one Docker Compose project with Postgres,
the Rust indexer, and Caddy serving the minimal explorer while proxying `/v1/*`
to the indexer.

After rsyncing this repo and `ref/torus-explorer` to the server:

```sh
cd /root/explorer/torus-sq-indexer
chmod +x deploy/*.sh
./deploy/up.sh
```

`deploy/up.sh` bootstraps Docker Compose on apt-based hosts, creates
`deploy/.env` on first run, builds the images, starts the stack, and checks
`/health`, `/`, and `/v1/status`. The Postgres data lives in the Docker volume
`torus_explorer_postgres-data`.

Useful follow-ups:

```sh
./deploy/status.sh
./deploy/logs.sh
```

The flake still ships `packages.default` and `nixosModules.default` for a later
torusform/NixOS deployment, but the Compose path is the fastest production path
for `torex.rs`.
