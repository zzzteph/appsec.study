FROM dunglas/frankenphp:1.9.1-builder-php8.4
RUN apt-get update \
 && apt-get install -y --no-install-recommends git \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN rm -rf public
COPY ./sources /app
RUN mv /app/admin/panel/.git.tmp /app/admin/panel/.git
COPY Caddyfile /etc/frankenphp/Caddyfile

EXPOSE 80
