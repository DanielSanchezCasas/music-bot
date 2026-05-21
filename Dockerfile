FROM node:20-bookworm-slim AS web-build

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install
COPY web/ ./
RUN pnpm build

FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        fontconfig \
        libfontconfig1 \
        python3 \
        python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY src ./src
COPY --from=web-build /app/web/dist ./web/dist

ENV NODE_ENV=production
ENV WEB_PORT=3000
ENV WEB_DISABLE_TERMINAL_PANEL=true

CMD ["node", "src/index.js"]
