
#!/usr/bin/env bash

while [ true ]
do
  queues=$(ps aux| grep -v grep| grep queue:work | wc -l);
  if [ "$queues" -lt "4" ]; then
  
   php /var/www/artisan queue:work database --queue=google --sleep=3 --tries=3 --timeout=300 > /var/www/queue.log &
  fi
  php /var/www/artisan schedule:run --verbose --no-interaction > /var/www/sghled.log &
  sleep 60
done
