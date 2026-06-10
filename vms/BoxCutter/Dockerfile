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

EXPOSE 8000
CMD ["python", "app.py"]
