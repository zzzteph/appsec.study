FROM php:8.1.12-cli-alpine3.16


RUN apk -U upgrade --no-cache \
   && apk add --no-cache libsodium-dev curl busybox-initscripts openrc bash coreutils ca-certificates
RUN docker-php-ext-install mysqli pdo_mysql exif pcntl bcmath sodium

RUN mkdir /var/log/cron
RUN touch /var/log/cron/cron.log

COPY ./cron/crontab /etc/cron.d/crontab
RUN chown -R www-data:www-data /var/log/cron

RUN /usr/bin/crontab -u www-data /etc/cron.d/crontab
CMD ["crond", "-f", "-l", "8"]


