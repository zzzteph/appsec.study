FROM dunglas/frankenphp:1.9.1-builder-php8.4
RUN apt-get update \
 && apt-get install -y --no-install-recommends sqlite3 \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN rm -rf public
COPY ./sources /app
COPY Caddyfile /etc/frankenphp/Caddyfile
# Build the SQLite DBs from init.sql (pictures + a users row whose password is
# stored in CLEARTEXT). Both index.php and the admin panel read ./stalker.db
# relative to their own directory, so build it in both. init.sql is then removed
# so the schema/password aren't shipped — you recover them via the SQLi.
RUN sqlite3 /app/stalker.db < /app/init.sql \
 && sqlite3 /app/admin/panel/stalker.db < /app/init.sql \
 && rm /app/init.sql
EXPOSE 80
