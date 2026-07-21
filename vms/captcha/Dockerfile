# ---- build the Vue SPA (code-split: dashboard chunk loads after login) ----
FROM node:20-slim AS web
WORKDIR /web
COPY web/package.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# ---- runtime ----
FROM node:20-slim
WORKDIR /app
COPY server/package.json ./
RUN npm install
COPY server/ ./
COPY --from=web /web/dist ./public
EXPOSE 80
CMD ["node", "index.js"]
