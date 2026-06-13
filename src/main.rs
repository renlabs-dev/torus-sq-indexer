//! Minimal Torus indexer: finalized transfers and account balances, nothing else.
//!
//! One process runs everything: migrate on boot, then a finalized-chain sync
//! loop and the read API side by side.

mod api;
mod sync;

use std::net::SocketAddr;

use anyhow::Result;
use clap::Parser;
use sqlx::postgres::PgPoolOptions;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[derive(Clone, Debug, Parser)]
#[command(
    name = "torus-indexer",
    about = "Minimal Torus transfers/accounts indexer"
)]
pub struct Config {
    /// Postgres connection string.
    #[arg(long, env = "DATABASE_URL")]
    pub database_url: String,
    /// Torus archive node WebSocket endpoint.
    #[arg(
        long,
        env = "TORUS_RPC_URL",
        default_value = "wss://archive.torus.network"
    )]
    pub rpc_url: String,
    /// HTTP bind address for the read API.
    #[arg(long, env = "TORUS_INDEXER_BIND", default_value = "0.0.0.0:8080")]
    pub bind: SocketAddr,
    /// Concurrent block fetches during backfill.
    #[arg(long, env = "TORUS_SYNC_CONCURRENCY", default_value_t = 96)]
    pub concurrency: usize,
    /// Blocks between full account re-scans once caught up to the tip.
    #[arg(long, env = "TORUS_RESCAN_INTERVAL", default_value_t = 10_000)]
    pub rescan_interval: u64,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("torus_indexer=info")),
        )
        .init();

    let config = Config::parse();
    let pool = PgPoolOptions::new()
        .max_connections(8)
        .connect(&config.database_url)
        .await?;
    sqlx::migrate!().run(&pool).await?;

    let api = tokio::spawn(api::serve(config.bind, pool.clone()));
    let sync = tokio::spawn(sync::run(config, pool));

    tokio::select! {
        result = api => result??,
        result = sync => result??,
        _ = tokio::signal::ctrl_c() => info!("shutting down"),
    }
    Ok(())
}
