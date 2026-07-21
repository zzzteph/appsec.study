# API-only (OpenAPI/Swagger UI) — no web build stage.
FROM node:20-slim
WORKDIR /app
COPY server/package.json ./
RUN npm install --omit=dev
COPY server/ ./
EXPOSE 80
CMD ["node", "index.js"]
