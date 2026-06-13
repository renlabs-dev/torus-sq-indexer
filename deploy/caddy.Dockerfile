FROM node:22-bookworm AS explorer

WORKDIR /app
COPY ref/torus-explorer/package*.json ./
RUN npm ci

COPY ref/torus-explorer/ ./
ARG VITE_INDEXER_API_URL
ENV VITE_INDEXER_API_URL=${VITE_INDEXER_API_URL}
RUN npm run build

FROM caddy:2-alpine

COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=explorer /app/dist /srv
