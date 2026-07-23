FROM php:8.2-apache

ARG WP_VERSION=6.4.4
ENV DB_DATABASE=wordpress \
    DB_USER=wpuser \
    DB_PASSWORD=wp_p@ss_2024 \
    WP_ADMIN_PW=Acme!Admin#2024 \
    WP_URL=http://localhost

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates curl less unzip \
      mariadb-server \
      libpng-dev libjpeg-dev libzip-dev \
 && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-jpeg \
 && docker-php-ext-install mysqli gd zip

RUN { \
      echo 'display_errors = On'; \
      echo 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_NOTICE'; \
      echo 'file_uploads = On'; \
      echo 'upload_max_filesize = 16M'; \
      echo 'post_max_size = 16M'; \
    } > /usr/local/etc/php/conf.d/acme.ini

# wp-cli
RUN curl -fsSL -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
 && chmod +x /usr/local/bin/wp

# WordPress core
RUN rm -rf /var/www/html/* \
 && wp core download --version="${WP_VERSION}" --path=/var/www/html --allow-root

# vulnerable first-party plugin
COPY plugin/acme-portal /var/www/html/wp-content/plugins/acme-portal
RUN chown -R www-data:www-data /var/www/html

COPY entrypoint.sh /usr/local/bin/acme-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/acme-entrypoint.sh && chmod +x /usr/local/bin/acme-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/acme-entrypoint.sh"]
