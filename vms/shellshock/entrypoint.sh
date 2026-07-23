#!/bin/sh
. /etc/apache2/envvars 2>/dev/null || true
mkdir -p /var/run/apache2/socks /var/lock/apache2
chown -R www-data:www-data /var/run/apache2 2>/dev/null || true
rm -f /var/run/apache2/apache2.pid
echo "[netguard] appliance web console starting on :80"
exec apache2 -D FOREGROUND
