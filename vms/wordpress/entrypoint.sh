#!/bin/bash
set -e
cd /var/www/html

DB_DATABASE="${DB_DATABASE:-wordpress}"
DB_USER="${DB_USER:-wpuser}"
DB_PASSWORD="${DB_PASSWORD:-wp_p@ss_2024}"
WP_ADMIN_PW="${WP_ADMIN_PW:-Acme!Admin#2024}"
WP_URL="${WP_URL:-http://localhost}"
DATADIR=/var/lib/mysql
WPCLI="wp --allow-root --path=/var/www/html"

wait_for() { label=$1; shift; for _ in $(seq 1 30); do if "$@" >/dev/null 2>&1; then return 0; fi; sleep 1; done; echo "[acme] $label not ready" >&2; }

# ---- MariaDB ----
if [ ! -d "$DATADIR/mysql" ]; then
  mariadb-install-db --user=mysql --datadir="$DATADIR" --auth-root-authentication-method=normal >/dev/null
fi
chown -R mysql:mysql "$DATADIR"
mysqld_safe --datadir="$DATADIR" >/dev/null 2>&1 &
wait_for MariaDB mysqladmin ping --silent

# fresh, deterministic slate every boot (survives the periodic restart, wipes any attacker artefacts)
mysql -u root <<SQL
DROP DATABASE IF EXISTS ${DB_DATABASE};
CREATE DATABASE ${DB_DATABASE} CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_DATABASE}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL
rm -rf /var/www/html/wp-content/uploads/acme-attachments

# ---- wp-config ----
if [ ! -f wp-config.php ]; then
  $WPCLI config create --dbname="$DB_DATABASE" --dbuser="$DB_USER" --dbpass="$DB_PASSWORD" --dbhost=127.0.0.1 --skip-check
  $WPCLI config set FS_METHOD direct
  # serve correctly behind any host / the platform proxy
  grep -q HTTP_HOST wp-config.php || sed -i "/Happy publishing/i if(!empty(\$_SERVER['HTTP_HOST'])){define('WP_SITEURL','http://'.\$_SERVER['HTTP_HOST']);define('WP_HOME','http://'.\$_SERVER['HTTP_HOST']);}" wp-config.php
fi

# ---- install + seed (every boot, DB was just recreated) ----
$WPCLI core install --url="$WP_URL" --title="Acme Corp — Member Portal" --admin_user=admin --admin_password="$WP_ADMIN_PW" --admin_email=admin@acme.test --skip-email
$WPCLI user create sarah sarah@acme.test --role=editor --user_pass=sunshine >/dev/null
$WPCLI user create mike mike@acme.test --role=author --user_pass='Autumn2024!' >/dev/null
$WPCLI user create demo demo@acme.test --role=subscriber --user_pass=demo >/dev/null
$WPCLI plugin activate acme-portal

# seed support tickets (activation created wp_acme_tickets)
$WPCLI db query "INSERT INTO wp_acme_tickets (user_login,subject,body,secret_note,status) VALUES
 ('sarah','Billing page returns 500','The invoices tab throws an error after login.','Internal: staging admin token STG-77c1a9e4','open'),
 ('mike','Refund for order 5521','Customer wants a refund on the annual plan.','Internal: refunds mailbox password ref!2024#','open'),
 ('demo','How do I export my data?','Where can I download an export of my account?','none','closed');"

# realistic content
$WPCLI post create --post_type=page --post_status=publish --post_title="Member Support" --post_content="[acme_hello]
[acme_search_form]
Need help? Search our ticket knowledge base above or contact the Acme team." >/dev/null
$WPCLI post create --post_status=publish --post_title="Welcome to the Acme Member Portal" --post_content="Manage your subscription, open support tickets and browse member resources — all in one place." >/dev/null
$WPCLI post create --post_status=publish --post_title="Scheduled maintenance this weekend" --post_content="Our billing system will be briefly unavailable on Saturday night for upgrades." >/dev/null
$WPCLI option update blogdescription "Members-only support and resources" >/dev/null

mkdir -p /var/www/html/wp-content/uploads/acme-attachments
chown -R www-data:www-data /var/www/html/wp-content
echo "[acme] WordPress ready"

exec apache2-foreground
