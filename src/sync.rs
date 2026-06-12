//! Finalized-chain sync: extract `Balances.Transfer` events and keep account
//! balances current.
//!
//! Strategy: blocks are fetched concurrently but committed strictly in order,
//! one transaction per block, with the resume position in `indexer_status`.
//! Every balance change on Torus emits a `Balances.*` event (emission rewards
//! included) and stake is a named reserve, so refreshing `System::Account` for
//! every address mentioned in `Balances`/`Torus0` events keeps balances exact.
//! A periodic full `System::Account` scan at the tip is the safety net that
//! also picks up accounts never touched by an event (e.g. genesis allocations).

use std::collections::{BTreeSet, HashMap};
use std::time::Duration;

use anyhow::{Context, Result, bail};
use futures::{StreamExt, stream::FuturesOrdered};
use parity_scale_codec::Decode;
use sqlx::PgPool;
use subxt::{
    Metadata, OnlineClient, SubstrateConfig,
    backend::{legacy::LegacyRpcMethods, rpc::RpcClient},
    client::RuntimeVersion,
    config::substrate::H256,
    ext::scale_value::{Composite, Value, ValueDef},
    utils::AccountId32,
};
use tokio::sync::Mutex;
use tracing::{error, info};

use crate::Config;

const TIP_POLL_INTERVAL: Duration = Duration::from_secs(4);
/// Sender marker the legacy indexer used for the one-shot bridge migration
/// credits; the explorer's address book knows it by name.
const COMMUNE_BRIDGE_ADDRESS: &str = "CommuneBridge";
const GENESIS_BRIDGE_TIMESTAMP_MS: i64 = 1_735_945_860_000;
const GENESIS_BRIDGE_TRANSFERS_CSV: &str = include_str!("../data/genesis_bridge_transfers.csv");

pub async fn run(config: Config, pool: PgPool) -> Result<()> {
    loop {
        if let Err(error) = sync_chain(&config, &pool).await {
            error!(?error, "sync failed, retrying in 5s");
            tokio::time::sleep(Duration::from_secs(5)).await;
        }
    }
}

async fn sync_chain(config: &Config, pool: &PgPool) -> Result<()> {
    let chain = Chain::connect(&config.rpc_url).await?;
    insert_genesis_bridge_credits(pool).await?;
    let mut specs = SpecVersions::bootstrap(&chain).await?;

    loop {
        let target = chain.finalized_height().await?;
        specs.extend_to(&chain, target).await?;
        sqlx::query("update indexer_status set target_height = $1, updated_at = now() where id")
            .bind(target as i64)
            .execute(pool)
            .await?;

        let last = last_height(pool).await?;
        if last < target as i64 {
            sync_range(
                &chain,
                &specs,
                pool,
                (last + 1) as u64,
                target,
                config.concurrency,
            )
            .await?;
        } else {
            maybe_rescan_accounts(&chain, pool, target, config.rescan_interval).await?;
            tokio::time::sleep(TIP_POLL_INTERVAL).await;
        }
    }
}

async fn sync_range(
    chain: &Chain,
    specs: &SpecVersions,
    pool: &PgPool,
    from: u64,
    to: u64,
    concurrency: usize,
) -> Result<()> {
    let mut next = from;
    let mut pending = FuturesOrdered::new();

    while next <= to || !pending.is_empty() {
        while next <= to && pending.len() < concurrency {
            pending.push_back(fetch_block(chain, specs.spec_for(next), next));
            next += 1;
        }
        if let Some(block) = pending.next().await {
            commit_block(pool, block?).await?;
        }
    }
    Ok(())
}

struct BlockData {
    height: u64,
    timestamp_ms: u64,
    transfers: Vec<Transfer>,
    accounts: Vec<AccountBalance>,
}

struct Transfer {
    event_index: i32,
    from: String,
    to: String,
    amount: u128,
}

struct AccountBalance {
    address: String,
    free: u128,
    staked: u128,
}

async fn fetch_block(chain: &Chain, spec_version: u32, height: u64) -> Result<BlockData> {
    let hash = chain.block_hash(height).await?;
    let client = chain.client_for(spec_version, hash).await?;
    let events = client.blocks().at(hash).await?.events().await?;

    let mut transfers = Vec::new();
    let mut touched = BTreeSet::new();
    for event in events.iter() {
        let event = event?;
        let pallet = event.pallet_name();
        if pallet != "Balances" && pallet != "Torus0" {
            continue;
        }
        let fields: Vec<Value<u32>> = event.field_values()?.values().cloned().collect();
        for field in &fields {
            collect_account_ids(field, &mut touched);
        }
        if pallet == "Balances" && event.variant_name() == "Transfer" {
            let (Some(from), Some(to), Some(amount)) = (
                fields.first().and_then(as_account_id),
                fields.get(1).and_then(as_account_id),
                fields.get(2).and_then(Value::as_u128),
            ) else {
                bail!("malformed Balances.Transfer at block {height}");
            };
            transfers.push(Transfer {
                event_index: event.index() as i32,
                from: AccountId32(from).to_string(),
                to: AccountId32(to).to_string(),
                amount,
            });
        }
    }

    let accounts =
        futures::future::try_join_all(touched.iter().map(|id| chain.account_at(hash, *id))).await?;

    let timestamp_ms = chain.timestamp_at(hash).await?.unwrap_or(0);
    if height > 0 && timestamp_ms == 0 {
        bail!("Timestamp::Now missing at block {height}");
    }

    Ok(BlockData {
        height,
        timestamp_ms,
        transfers,
        accounts,
    })
}

async fn commit_block(pool: &PgPool, block: BlockData) -> Result<()> {
    let mut tx = pool.begin().await?;
    for transfer in &block.transfers {
        sqlx::query(
            "insert into transfers (block_height, event_index, from_address, to_address, amount, timestamp_ms)
             values ($1, $2, $3, $4, $5::numeric, $6)
             on conflict (block_height, event_index) do nothing",
        )
        .bind(block.height as i64)
        .bind(transfer.event_index)
        .bind(&transfer.from)
        .bind(&transfer.to)
        .bind(transfer.amount.to_string())
        .bind(block.timestamp_ms as i64)
        .execute(&mut *tx)
        .await?;
    }
    for account in &block.accounts {
        upsert_account(&mut *tx, account, block.height).await?;
    }
    sqlx::query("update indexer_status set last_height = $1, updated_at = now() where id")
        .bind(block.height as i64)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    if block.height.is_multiple_of(1000) || !block.transfers.is_empty() {
        info!(
            height = block.height,
            transfers = block.transfers.len(),
            accounts = block.accounts.len(),
            "committed block"
        );
    }
    Ok(())
}

async fn upsert_account(
    executor: impl sqlx::PgExecutor<'_>,
    account: &AccountBalance,
    height: u64,
) -> Result<()> {
    sqlx::query(
        "insert into accounts (address, free, staked, updated_height)
         values ($1, $2::numeric, $3::numeric, $4)
         on conflict (address) do update set
             free = excluded.free,
             staked = excluded.staked,
             updated_height = excluded.updated_height",
    )
    .bind(&account.address)
    .bind(account.free.to_string())
    .bind(account.staked.to_string())
    .bind(height as i64)
    .execute(executor)
    .await?;
    Ok(())
}

/// Full `System::Account` scan at the tip. Runs once when first caught up,
/// then every `rescan_interval` blocks; removes accounts that left storage.
async fn maybe_rescan_accounts(
    chain: &Chain,
    pool: &PgPool,
    target: u64,
    rescan_interval: u64,
) -> Result<()> {
    let last_rescan =
        sqlx::query_scalar::<_, i64>("select last_rescan_height from indexer_status where id")
            .fetch_one(pool)
            .await?;
    if last_rescan >= 0 && target.saturating_sub(last_rescan as u64) < rescan_interval {
        return Ok(());
    }

    let hash = chain.block_hash(target).await?;
    let accounts = chain.scan_accounts(hash).await?;
    info!(
        height = target,
        count = accounts.len(),
        "rescanning all accounts"
    );

    let mut tx = pool.begin().await?;
    for account in &accounts {
        upsert_account(&mut *tx, account, target).await?;
    }
    sqlx::query("delete from accounts where updated_height < $1")
        .bind(target as i64)
        .execute(&mut *tx)
        .await?;
    sqlx::query("update indexer_status set last_rescan_height = $1, updated_at = now() where id")
        .bind(target as i64)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(())
}

async fn last_height(pool: &PgPool) -> Result<i64> {
    Ok(
        sqlx::query_scalar::<_, i64>("select last_height from indexer_status where id")
            .fetch_one(pool)
            .await?,
    )
}

/// One-shot synthetic transfers for the Commune bridge migration credits.
/// Real historical facts from the legacy indexer, not derivable from events.
async fn insert_genesis_bridge_credits(pool: &PgPool) -> Result<()> {
    let exists = sqlx::query_scalar::<_, bool>(
        "select exists(select 1 from transfers where block_height = 0 and event_index < 0)",
    )
    .fetch_one(pool)
    .await?;
    if exists {
        return Ok(());
    }

    let credits = genesis_bridge_credits()?;
    let mut tx = pool.begin().await?;
    for (index, (address, amount)) in credits.iter().enumerate() {
        sqlx::query(
            "insert into transfers (block_height, event_index, from_address, to_address, amount, timestamp_ms)
             values (0, $1, $2, $3, $4::numeric, $5)
             on conflict (block_height, event_index) do nothing",
        )
        .bind(-(index as i32) - 1)
        .bind(COMMUNE_BRIDGE_ADDRESS)
        .bind(address)
        .bind(amount.to_string())
        .bind(GENESIS_BRIDGE_TIMESTAMP_MS)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    info!(count = credits.len(), "inserted genesis bridge credits");
    Ok(())
}

fn genesis_bridge_credits() -> Result<Vec<(String, u128)>> {
    GENESIS_BRIDGE_TRANSFERS_CSV
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| {
            let (address, amount) = line
                .split_once(',')
                .context("genesis bridge csv row missing comma")?;
            Ok((address.to_string(), amount.parse::<u128>()?))
        })
        .collect()
}

/// Connected Torus archive node with a per-spec-version client cache, so
/// historical blocks decode against the metadata that was live when they ran.
struct Chain {
    rpc: LegacyRpcMethods<SubstrateConfig>,
    rpc_client: RpcClient,
    genesis_hash: H256,
    clients: Mutex<HashMap<u32, OnlineClient<SubstrateConfig>>>,
}

impl Chain {
    async fn connect(rpc_url: &str) -> Result<Self> {
        let rpc_client = RpcClient::from_url(rpc_url)
            .await
            .with_context(|| format!("connecting to {rpc_url}"))?;
        let rpc = LegacyRpcMethods::<SubstrateConfig>::new(rpc_client.clone());
        let genesis_hash = rpc
            .chain_get_block_hash(Some(0u32.into()))
            .await?
            .context("node has no genesis hash")?;
        info!(rpc_url, "connected");
        Ok(Self {
            rpc,
            rpc_client,
            genesis_hash,
            clients: Mutex::new(HashMap::new()),
        })
    }

    async fn block_hash(&self, height: u64) -> Result<H256> {
        self.rpc
            .chain_get_block_hash(Some(u32::try_from(height)?.into()))
            .await?
            .with_context(|| format!("node has no hash for finalized height {height}"))
    }

    async fn finalized_height(&self) -> Result<u64> {
        let hash = self.rpc.chain_get_finalized_head().await?;
        let header = self
            .rpc
            .chain_get_header(Some(hash))
            .await?
            .context("node has no finalized header")?;
        Ok(u64::from(header.number))
    }

    async fn spec_version_at(&self, height: u64) -> Result<u32> {
        let hash = self.block_hash(height).await?;
        Ok(self
            .rpc
            .state_get_runtime_version(Some(hash))
            .await?
            .spec_version)
    }

    async fn client_for(
        &self,
        spec_version: u32,
        hash: H256,
    ) -> Result<OnlineClient<SubstrateConfig>> {
        if let Some(client) = self.clients.lock().await.get(&spec_version) {
            return Ok(client.clone());
        }
        let raw = self.rpc.state_get_metadata(Some(hash)).await?;
        let metadata = Metadata::try_from(raw.to_frame_metadata()?)
            .context("converting historical metadata")?;
        let version = self.rpc.state_get_runtime_version(Some(hash)).await?;
        let client = OnlineClient::from_rpc_client_with(
            self.genesis_hash,
            RuntimeVersion {
                spec_version: version.spec_version,
                transaction_version: version.transaction_version,
            },
            metadata,
            self.rpc_client.clone(),
        )?;
        self.clients
            .lock()
            .await
            .insert(spec_version, client.clone());
        Ok(client)
    }

    async fn timestamp_at(&self, hash: H256) -> Result<Option<u64>> {
        let key = storage_prefix("Timestamp", "Now");
        self.rpc
            .state_get_storage(&key, Some(hash))
            .await?
            .map(|data| decode_exact::<u64>(&data))
            .transpose()
    }

    async fn account_at(&self, hash: H256, id: [u8; 32]) -> Result<AccountBalance> {
        let mut key = storage_prefix("System", "Account");
        key.extend(sp_crypto_hashing::blake2_128(&id));
        key.extend(id);
        let record = self
            .rpc
            .state_get_storage(&key, Some(hash))
            .await?
            .map(|data| decode_account(&data))
            .transpose()?
            .unwrap_or_default();
        Ok(AccountBalance {
            address: AccountId32(id).to_string(),
            free: record.free,
            staked: record.reserved,
        })
    }

    async fn scan_accounts(&self, hash: H256) -> Result<Vec<AccountBalance>> {
        let prefix = storage_prefix("System", "Account");
        let mut keys: Vec<Vec<u8>> = Vec::new();
        loop {
            let page = self
                .rpc
                .state_get_keys_paged(&prefix, 1000, keys.last().map(Vec::as_slice), Some(hash))
                .await?;
            if page.is_empty() {
                break;
            }
            keys.extend(page);
        }

        let mut accounts = Vec::with_capacity(keys.len());
        for chunk in keys.chunks(500) {
            let change_sets = self
                .rpc
                .state_query_storage_at(chunk.iter().map(Vec::as_slice), Some(hash))
                .await?;
            let change_set = change_sets
                .into_iter()
                .next()
                .context("empty storage change set")?;
            for (key, value) in change_set.changes {
                let Some(value) = value else { continue };
                // Map key layout: 32-byte prefix ++ blake2_128 ++ account id.
                let id: [u8; 32] = key.0.get(48..80).context("short account key")?.try_into()?;
                let record = decode_account(&value.0)?;
                accounts.push(AccountBalance {
                    address: AccountId32(id).to_string(),
                    free: record.free,
                    staked: record.reserved,
                });
            }
        }
        Ok(accounts)
    }
}

/// Spec versions are monotonic in height; bisect the upgrade boundaries once
/// so the per-block hot path never queries the runtime version.
struct SpecVersions {
    /// `(first_height, spec_version)`, ascending, starting at height 0.
    segments: Vec<(u64, u32)>,
    covered_to: u64,
}

impl SpecVersions {
    async fn bootstrap(chain: &Chain) -> Result<Self> {
        let genesis_spec = chain.spec_version_at(0).await?;
        Ok(Self {
            segments: vec![(0, genesis_spec)],
            covered_to: 0,
        })
    }

    fn spec_for(&self, height: u64) -> u32 {
        match self
            .segments
            .binary_search_by_key(&height, |segment| segment.0)
        {
            Ok(index) => self.segments[index].1,
            Err(index) => self.segments[index - 1].1,
        }
    }

    async fn extend_to(&mut self, chain: &Chain, target: u64) -> Result<()> {
        if target <= self.covered_to {
            return Ok(());
        }
        let target_spec = chain.spec_version_at(target).await?;
        let mut ranges = vec![(
            self.covered_to,
            self.spec_for(self.covered_to),
            target,
            target_spec,
        )];
        while let Some((low, low_spec, high, high_spec)) = ranges.pop() {
            if low_spec == high_spec {
                continue;
            }
            if high == low + 1 {
                self.segments.push((high, high_spec));
                continue;
            }
            let mid = low + (high - low) / 2;
            let mid_spec = chain.spec_version_at(mid).await?;
            ranges.push((low, low_spec, mid, mid_spec));
            ranges.push((mid, mid_spec, high, high_spec));
        }
        self.segments.sort_unstable();
        self.covered_to = target;
        if self.segments.len() > 1 {
            info!(segments = ?self.segments, "runtime upgrade map");
        }
        Ok(())
    }
}

fn storage_prefix(pallet: &str, entry: &str) -> Vec<u8> {
    let mut key = Vec::with_capacity(32);
    key.extend(sp_crypto_hashing::twox_128(pallet.as_bytes()));
    key.extend(sp_crypto_hashing::twox_128(entry.as_bytes()));
    key
}

/// `System::Account` value. Only free/reserved are needed; they have been the
/// first two `u128`s of `AccountData` in every Torus runtime so far, and stake
/// is a named reserve, so `reserved` is the staked balance.
#[derive(Debug, Default, Decode)]
struct AccountRecord {
    free: u128,
    reserved: u128,
}

#[derive(Debug, Decode)]
struct AccountInfo {
    _nonce: u32,
    _consumers: u32,
    _providers: u32,
    _sufficients: u32,
    free: u128,
    reserved: u128,
    _frozen: u128,
    _flags: u128,
}

fn decode_account(encoded: &[u8]) -> Result<AccountRecord> {
    let info = decode_exact::<AccountInfo>(encoded)?;
    Ok(AccountRecord {
        free: info.free,
        reserved: info.reserved,
    })
}

fn decode_exact<T: Decode>(encoded: &[u8]) -> Result<T> {
    let mut input = encoded;
    let value = T::decode(&mut input).context("SCALE decode failed")?;
    if !input.is_empty() {
        bail!("decoded storage value left {} trailing bytes", input.len());
    }
    Ok(value)
}

fn as_account_id(value: &Value<u32>) -> Option<[u8; 32]> {
    bytes_of(value).and_then(|bytes| bytes.try_into().ok())
}

/// Unwrap newtype/variant wrappers down to a raw byte array, e.g.
/// `AccountId32([u8; 32])` or `MultiAddress::Id(AccountId32(..))`.
fn bytes_of(value: &Value<u32>) -> Option<Vec<u8>> {
    match &value.value {
        ValueDef::Composite(Composite::Unnamed(items)) => items
            .iter()
            .map(|item| item.as_u128().and_then(|byte| u8::try_from(byte).ok()))
            .collect::<Option<Vec<_>>>()
            .or_else(|| (items.len() == 1).then(|| bytes_of(&items[0])).flatten()),
        ValueDef::Composite(Composite::Named(items)) if items.len() == 1 => bytes_of(&items[0].1),
        ValueDef::Variant(variant) if variant.values.len() == 1 => {
            variant.values.values().next().and_then(bytes_of)
        }
        _ => None,
    }
}

fn collect_account_ids(value: &Value<u32>, out: &mut BTreeSet<[u8; 32]>) {
    if let Some(id) = as_account_id(value) {
        out.insert(id);
        return;
    }
    match &value.value {
        ValueDef::Composite(composite) => {
            composite
                .values()
                .for_each(|item| collect_account_ids(item, out));
        }
        ValueDef::Variant(variant) => {
            variant
                .values
                .values()
                .for_each(|item| collect_account_ids(item, out));
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use parity_scale_codec::Encode;

    use super::*;

    #[test]
    fn decodes_account_balances() {
        let mut encoded = Vec::new();
        (7u32, 1u32, 1u32, 0u32).encode_to(&mut encoded);
        (100u128, 25u128, 0u128, 0u128).encode_to(&mut encoded);

        let record = decode_account(&encoded).unwrap();
        assert_eq!(record.free, 100);
        assert_eq!(record.reserved, 25);

        encoded.push(0);
        assert!(decode_account(&encoded).is_err());
    }

    #[test]
    fn genesis_bridge_credits_match_legacy_totals() {
        let credits = genesis_bridge_credits().unwrap();
        assert_eq!(credits.len(), 592);
        let total: u128 = credits.iter().map(|(_, amount)| amount).sum();
        assert_eq!(total, 65_786_961_454_650_542_000_000_000);
    }

    #[test]
    fn extracts_account_id_from_nested_value() {
        let id = [7u8; 32];
        let inner = Value::with_context(
            ValueDef::Composite(Composite::Unnamed(
                id.iter()
                    .map(|byte| {
                        Value::with_context(
                            ValueDef::Primitive(subxt::ext::scale_value::Primitive::u128(
                                u128::from(*byte),
                            )),
                            0,
                        )
                    })
                    .collect(),
            )),
            0,
        );
        let wrapped = Value::with_context(ValueDef::Composite(Composite::Unnamed(vec![inner])), 0);

        assert_eq!(as_account_id(&wrapped), Some(id));

        let mut out = BTreeSet::new();
        collect_account_ids(&wrapped, &mut out);
        assert_eq!(out.into_iter().collect::<Vec<_>>(), vec![id]);
    }
}
