FROM php:8.2-apache

ARG DVWA_VERSION=2.5

ENV DB_SERVER=127.0.0.1 \
    DB_DATABASE=dvwa \
    DB_USER=dvwa \
    DB_PASSWORD=p@ssw0rd \
    DB_PORT=3306 \
    DEFAULT_SECURITY_LEVEL=low

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      unzip \
      mariadb-server \
      libpng-dev \
 && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd \
 && docker-php-ext-install mysqli pdo_mysql gd

RUN { \
      echo 'allow_url_fopen = On'; \
      echo 'allow_url_include = On'; \
      echo 'display_errors = On'; \
      echo 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT'; \
    } > /usr/local/etc/php/conf.d/dvwa.ini

RUN curl -fsSL -o /tmp/dvwa.zip \
      "https://github.com/digininja/DVWA/archive/refs/tags/${DVWA_VERSION}.zip" \
 && rm -rf /var/www/html \
 && unzip -q /tmp/dvwa.zip -d /tmp \
 && mv "/tmp/DVWA-${DVWA_VERSION}" /var/www/html \
 && rm -rf /tmp/dvwa.zip

RUN cp /var/www/html/config/config.inc.php.dist /var/www/html/config/config.inc.php \
 && sed -i "s#getenv('DISABLE_AUTHENTICATION') ?: false;#true;#" /var/www/html/config/config.inc.php \
 && chown -R www-data:www-data /var/www/html \
 && chmod -R 0777 /var/www/html/hackable/uploads

COPY <<'EOF' /usr/local/bin/dvwa-entrypoint.sh
#!/bin/bash
set -e

DB_DATABASE="${DB_DATABASE:-dvwa}"
DB_USER="${DB_USER:-dvwa}"
DB_PASSWORD="${DB_PASSWORD:-p@ssw0rd}"
DATADIR=/var/lib/mysql
BASE_URL=http://127.0.0.1

mysql_root() { mysql -u root "$@"; }

wait_for() {
  label=$1; shift
  for _ in $(seq 1 30); do
    if "$@" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "[dvwa] warning: $label not ready after 30s" >&2
}

if [ ! -d "$DATADIR/mysql" ]; then
  mariadb-install-db --user=mysql --datadir="$DATADIR" --auth-root-authentication-method=normal >/dev/null
fi

mysqld_safe --datadir="$DATADIR" &
wait_for MariaDB mysqladmin ping --silent

mysql_root <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_DATABASE};
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_DATABASE}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

apache2-foreground &
APACHE_PID=$!
wait_for Apache curl -fs -o /dev/null "$BASE_URL/login.php"

TABLE_COUNT=$(mysql_root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_DATABASE}';" || echo 0)
if [ "${TABLE_COUNT:-0}" -eq 0 ]; then
  CJ=$(mktemp)
  TOKEN=$(curl -s -c "$CJ" "$BASE_URL/setup.php" | grep -o 'user_token[^>]*' | grep -oE '[0-9a-f]{32}' | head -n1)
  curl -s -b "$CJ" -c "$CJ" \
    --data-urlencode 'create_db=Create / Reset Database' \
    --data-urlencode "user_token=$TOKEN" \
    "$BASE_URL/setup.php" >/dev/null || true
  rm -f "$CJ"
fi

wait "$APACHE_PID"
EOF

RUN chmod +x /usr/local/bin/dvwa-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/dvwa-entrypoint.sh"]
