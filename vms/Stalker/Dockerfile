FROM dunglas/frankenphp:1.9.1-builder-php8.4
RUN apt-get update \
 && apt-get install -y --no-install-recommends git \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN rm -rf public
COPY ./sources /app
COPY Caddyfile /etc/frankenphp/Caddyfile

EXPOSE 80
