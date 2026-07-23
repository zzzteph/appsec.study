# ---- build the Vue SPA ----
FROM node:20-slim AS web
WORKDIR /web
COPY web/package.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# ---- install server deps (pure JS) ----
FROM node:20-slim AS deps
WORKDIR /app
COPY server/package.json ./
RUN npm install --omit=dev

# ---- runtime ----
FROM node:20-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./
COPY --from=web /web/dist ./public
EXPOSE 80
CMD ["node", "index.js"]
