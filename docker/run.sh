#docker rm -f $(docker ps -qa)
#docker rmi -f $(docker images -aq)
#yes| docker volume prune
docker compose up -d 
docker compose exec appsec-app composer update
docker compose exec appsec-app php artisan storage:link
docker compose exec appsec-app chmod 777 -R storage/
docker compose exec appsec-app chmod 777 *.log
docker compose exec appsec-app cp /var/www/html/.env.docker /var/www/html/.env
sleep 30
docker compose exec appsec-app php artisan key:generate
docker compose exec appsec-app php artisan migrate
