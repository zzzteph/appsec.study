FROM php:8.1.12-fpm-alpine3.16


#packages installing
RUN apk -U upgrade --no-cache \
   && apk add --no-cache libsodium-dev curl supervisor
RUN docker-php-ext-install mysqli pdo_mysql exif pcntl bcmath sodium
RUN curl -sSL https://getcomposer.org/installer | php \
    && mv composer.phar /usr/local/bin/composer


RUN mkdir -p /var/log/supervisor
COPY supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD ["/usr/bin/supervisord","-c","/etc/supervisor/conf.d/supervisord.conf"]




