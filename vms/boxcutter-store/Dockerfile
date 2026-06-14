# Boxcutter Store - deliberately vulnerable test target.
# Build:  docker build -t boxcutter-store ./test
# Run:    docker run --rm -p 8000:8000 boxcutter-store
# Then point a scanner at https://localhost:8000 (self-signed cert)
# To disable HTTPS: docker run --rm -p 8000:8000 -e HTTPS=0 boxcutter-store

# ---- stage 1: build the Vue account SPA ----
FROM node:20-slim AS frontend
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build          # outputs /fe/dist

# ---- stage 2: Python app, with the built SPA copied in ----
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --from=frontend /fe/dist ./static/spa
# Swagger UI assets are vendored in static/swagger (copied above) so /api/docs
# renders with no CDN and the build needs no network.

EXPOSE 8000
# Default server is gunicorn (worker threads) so slow planted endpoints can't
# block the whole site under load; it serves plain HTTP (terminate TLS upstream).
# Set SERVER=dev to fall back to the single-process Flask dev server + self-signed
# cert for local scanner testing. See serve.py.
CMD ["python", "serve.py"]
