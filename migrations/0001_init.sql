create table indexer_status (
    id boolean primary key default true check (id),
    last_height bigint not null default -1,
    target_height bigint not null default -1,
    last_rescan_height bigint not null default -1,
    updated_at timestamptz not null default now()
);

insert into indexer_status (id) values (true);

create table transfers (
    block_height bigint not null,
    event_index integer not null,
    from_address text not null,
    to_address text not null,
    amount numeric(39, 0) not null,
    timestamp_ms bigint not null,
    primary key (block_height, event_index)
);

create index transfers_order_idx on transfers (block_height desc, event_index desc);
create index transfers_from_idx on transfers (from_address, block_height desc, event_index desc);
create index transfers_to_idx on transfers (to_address, block_height desc, event_index desc);

create table accounts (
    address text primary key,
    free numeric(39, 0) not null,
    staked numeric(39, 0) not null,
    total numeric(39, 0) generated always as (free + staked) stored,
    updated_height bigint not null
);

create index accounts_total_idx on accounts (total desc, address asc);
