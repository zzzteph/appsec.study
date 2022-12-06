FROM php:8.1.12-fpm-alpine3.16


#packages installing
RUN apk -U upgrade --no-cache \
    && apk add --no-cache autoconf bind-tools ca-certificates chromium chromium-chromedriver composer curl g++ gcc git imagemagick libffi-dev libgcc libpcap libpcap-dev libssl3 libstdc++ libtool linux-headers lua-dev make maven musl-dev mysql-client nginx nmap nmap-scripts openjdk17 openssl-dev php-bcmath php-calendar php-cli php-ctype php-curl php-dom php-exif php-ffi php-fileinfo php-fpm php-ftp php-gettext php-iconv php-mbstring php-mysqli php-opcache php-pdo php-phar php-posix php-shmop php-simplexml php-sockets php-sysvmsg php-sysvsem php-sysvshm php-tokenizer php-xml php-xmlreader php-xmlwriter php-xsl php-zip py3-pip python3-dev
RUN docker-php-ext-install mysqli pdo_mysql exif pcntl bcmath 


RUN git clone https://github.com/zzzteph/appsec.study /var/www/html
RUN cd /var/www/html/ && composer install
RUN cd /var/www/html/ && php artisan storage:link
RUN cd /var/www/html/ && chmod 777 -R storage/
RUN cd /var/www/html/ && chmod 777 *.log
RUN cp /var/www/html/.env.docker /var/www/html/.env
RUN mv /var/www/html/docker-compose/nginx/appsec.conf /etc/nginx/http.d/default.conf

EXPOSE 80 443
RUN mv /var/www/html/init.sh /init.sh
ENTRYPOINT ["sh", "/init.sh"]

