# ---- stage 1: build the Vue SPA ----
FROM node:20-slim AS web
WORKDIR /web
COPY web/package.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# ---- stage 2: server deps (native better-sqlite3) ----
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY server/package.json ./
RUN npm install

# ---- stage 3: runtime (clean, no build tools) ----
FROM node:20-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./
COPY --from=web /web/dist ./public
EXPOSE 80
CMD ["node", "index.js"]
