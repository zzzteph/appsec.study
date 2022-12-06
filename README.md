<p align="center">
  <img src="https://github.com/zzzteph/appsec.study/blob/main/dev/logo.png?raw=true">
</p>


AppsecStudy is an open-source eLearning management system for information security. 

Because preventing vulnerability is less costly than redeveloping the complete application, infosec education and training become more and more actual. As a result, developers can greatly reduce the risk and expense from cyber attacks in the future by creating secure code. In addition, training the team based on the security assessment results to correct actual errors provides ongoing protection for existing and future products.

Since studying is impossible without a practical part, providing hands-on lab training for developing teams is a necessary step.
AppsecStudy - an open-source platform for seminars, training, and organizing courses for practical information security for developers and IT specialists. This tool has all the built-in basic requirements needed for organizing normal and productive training.



# Setup

## Docker

First you need to install docker on your system. After that navigate ```Docker``` folder and run ```run.sh``` or type next commands

```
docker-compose up -d 
sleep 30
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate
```

## Manual setup

**Requirements**
* PHP >= 8.1
* laravel 9 
* composer 2

`apt-get install nginx nginx curl unzip unzip mariadb-server git `

### PHP 8

You need to install **php8** for laravel to work.

```
apt install php-fpm php-cli php-zip php-mbstring php-xml php-dev php-mysql php-pdo php-curl php-bcmath php-dom php-ctype php-cli
```


If you use **Debian** based distro or **php8** is missing, you can do next

```
sudo apt install -y lsb-release ca-certificates apt-transport-https software-properties-common gnupg2
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/sury-php.list
curl -fsSL  https://packages.sury.org/php/apt.gpg| sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sury-keyring.gpg
apt install php8.1-fpm php8.1-cli php8.1-zip php8.1-mbstring php8.1-xml php8.1-dev php8.1-mysql php8.1-pdo php8.1-curl php8.1-bcmath php8.1-dom php8.1-ctype php8.1-cli
```


### Nginx configuration

Configure Nginx to serve the app

```
server {
listen 80;
    server_name _;
    root /var/www/html/public; #change to correct folder
    large_client_header_buffers 4 16k;
    index index.php;

    client_max_body_size 100m;
    charset utf-8;

  location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```


### Composer


```
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php -r "if (hash_file('sha384', 'composer-setup.php') === '55ce33d7678c5a611085589f1f3ddf8b3c52d662cd01d4ba75c0ee0459970c2200a51f492d557530c71c15d8dba01eae') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
php composer-setup.php
php -r "unlink('composer-setup.php');"
mv composer.phar /usr/local/bin/composer
```

### Database configuration

```
mysql -e "UPDATE mysql.user SET Password = PASSWORD('12345') WHERE User = 'root'"
mysql -e "DELETE FROM mysql.user WHERE User='';"
mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
mysql -e "DROP DATABASE IF EXISTS test;"
mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
mysql -e "create database scanner";
mysql -e "CREATE USER 'scanner'@'localhost' IDENTIFIED BY 'scanner'";
mysql -e "GRANT ALL PRIVILEGES ON scanner . * TO 'scanner'@'localhost'";
mysql -e "FLUSH PRIVILEGES";
```


### Migrations and folders

Download the **main** branch or **release** version and extract sources to folder, F.E **/var/www/html**

Navigate **/var/www/html**

Make some folders and files writable
```
php artisan storage:link
chmod 777 -R storage/
chmod 777 *.log
cd /var/www/html
composer install
php artisan migrate
```


# Configuration

## OAUTH Google

You need to create OAuth client ID in GCP and setup next values in ```.env``` file.

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```




# Contacts

- [@_w34kp455](https://twitter.com/w34kp455)
