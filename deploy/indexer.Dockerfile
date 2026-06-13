FROM rust:1-bookworm AS builder

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates pkg-config libssl-dev \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY src ./src
COPY migrations ./migrations
COPY data ./data
RUN cargo build --release --locked

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/torus-indexer /usr/local/bin/torus-indexer

USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/torus-indexer"]
