//! Read API for the explorer: status, transfers, accounts. Amounts travel as
//! planck strings (u128 doesn't fit JSON numbers).

use std::net::SocketAddr;
use std::str::FromStr;

use anyhow::Result;
use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use subxt::utils::AccountId32;
use tower_http::cors::CorsLayer;
use tracing::{error, info};

pub async fn serve(bind: SocketAddr, pool: PgPool) -> Result<()> {
    let router = Router::new()
        .route("/health", get(async || "ok"))
        .route("/v1/status", get(status))
        .route("/v1/transfers", get(transfers))
        .route("/v1/accounts", get(accounts))
        .route("/v1/accounts/{address}", get(account))
        .layer(CorsLayer::permissive())
        .with_state(pool);
    let listener = tokio::net::TcpListener::bind(bind).await?;
    info!(%bind, "api listening");
    axum::serve(listener, router).await?;
    Ok(())
}

#[derive(Serialize, sqlx::FromRow)]
struct Status {
    last_height: i64,
    target_height: i64,
}

#[derive(Serialize, sqlx::FromRow)]
struct Transfer {
    block_height: i64,
    event_index: i32,
    from: String,
    to: String,
    amount: String,
    timestamp_ms: i64,
}

#[derive(Serialize, sqlx::FromRow)]
struct Account {
    address: String,
    free: String,
    staked: String,
    total: String,
    updated_height: i64,
}

#[derive(Serialize)]
struct Page<T> {
    items: Vec<T>,
    has_more: bool,
}

#[derive(Deserialize)]
struct ListParams {
    address: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
}

impl ListParams {
    fn page(&self) -> (i64, i64) {
        (
            self.limit.unwrap_or(25).clamp(1, 100),
            self.offset.unwrap_or(0).max(0),
        )
    }
}

async fn status(State(pool): State<PgPool>) -> ApiResult<Json<Status>> {
    let status = sqlx::query_as::<_, Status>(
        "select last_height, target_height from indexer_status where id",
    )
    .fetch_one(&pool)
    .await?;
    Ok(Json(status))
}

async fn transfers(
    State(pool): State<PgPool>,
    Query(params): Query<ListParams>,
) -> ApiResult<Json<Page<Transfer>>> {
    let (limit, offset) = params.page();
    let address = params.address.as_deref().map(canonical_address);
    let mut items = sqlx::query_as::<_, Transfer>(
        "select block_height, event_index, from_address as from, to_address as to,
                amount::text as amount, timestamp_ms
         from transfers
         where $1::text is null or from_address = $1 or to_address = $1
         order by block_height desc, event_index desc
         limit $2 offset $3",
    )
    .bind(address)
    .bind(limit + 1)
    .bind(offset)
    .fetch_all(&pool)
    .await?;
    let has_more = items.len() as i64 > limit;
    items.truncate(limit as usize);
    Ok(Json(Page { items, has_more }))
}

async fn accounts(
    State(pool): State<PgPool>,
    Query(params): Query<ListParams>,
) -> ApiResult<Json<Page<Account>>> {
    let (limit, offset) = params.page();
    let mut items = sqlx::query_as::<_, Account>(
        "select address, free::text as free, staked::text as staked, total::text as total,
                updated_height
         from accounts
         order by accounts.total desc, accounts.address asc
         limit $1 offset $2",
    )
    .bind(limit + 1)
    .bind(offset)
    .fetch_all(&pool)
    .await?;
    let has_more = items.len() as i64 > limit;
    items.truncate(limit as usize);
    Ok(Json(Page { items, has_more }))
}

async fn account(
    State(pool): State<PgPool>,
    Path(address): Path<String>,
) -> ApiResult<Json<Account>> {
    let account = sqlx::query_as::<_, Account>(
        "select address, free::text as free, staked::text as staked, total::text as total,
                updated_height
         from accounts
         where address = $1",
    )
    .bind(canonical_address(&address))
    .fetch_optional(&pool)
    .await?
    .ok_or(ApiError::NotFound)?;
    Ok(Json(account))
}

/// Re-encode any valid ss58 input to the canonical form stored in the DB;
/// pass non-addresses (e.g. the "CommuneBridge" marker) through untouched.
fn canonical_address(input: &str) -> String {
    AccountId32::from_str(input).map_or_else(|_| input.to_string(), |id| id.to_string())
}

type ApiResult<T> = Result<T, ApiError>;

enum ApiError {
    NotFound,
    Internal(anyhow::Error),
}

impl<E: Into<anyhow::Error>> From<E> for ApiError {
    fn from(error: E) -> Self {
        Self::Internal(error.into())
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        match self {
            Self::NotFound => (StatusCode::NOT_FOUND, "not found").into_response(),
            Self::Internal(error) => {
                error!(?error, "api error");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal error").into_response()
            }
        }
    }
}
