
#!/usr/bin/env bash

while [ true ]
do
  queues=$(ps aux| grep -v grep| grep queue=cloud | wc -l);
  if [ "$queues" -lt "2" ]; then

   php artisan queue:work database --queue=cloud > cloud.log&
  fi

    queues=$(ps aux| grep -v grep| grep queue=listeners | wc -l);
  if [ "$queues" -lt "3" ]; then
   php artisan queue:work database --queue=listeners > listeners.log &
  fi

  php artisan schedule:run --verbose --no-interaction &
  sleep 60
done
