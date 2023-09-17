<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Rest\Cloudflare\Cloudflare;
use Illuminate\Support\Str;
class CloudFlareRun extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cloudflare:dns {action} {--name=} {--ip=} {--test=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage entries to cloudflare dns';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }


	 
    public function handle()
    {
		$cf=new Cloudflare();
		
		$action=$this->argument('action');
		
		if($action=='create')
		{ 
			$cf->create($this->option('name'),$this->option('ip'));
		}
		else if($action=='delete')
		{
			$cf->delete($this->option('name'),$this->option('ip'));
		}
		else if($action=="list")
		{
			$cf->list();
		}		
		else if($action=="truncate")
		{
			$cf->truncate();
		}
		else if($action=="test")
		{
			$failed=0;
			for($i=0;$i<intval($this->option('test'));$i++)
			{
				$name = "TEST".Str::random(32);
				$cf->create($name,"8.8.8.8");
				$exist=$cf->checkIfNameExist($name);
				$cf->delete($name,"8.8.8.8");
				;
				if($exist==TRUE && $cf->checkIfNameExist($name)==FALSE)
				{
					echo "Test run $i:done".PHP_EOL;
				}
				if($exist==FALSE )
				{
					$failed++;
					echo "Test run $i:failed - ".$name." UNABLE TO CREATE".PHP_EOL;
				}
				if($cf->checkIfNameExist($name)==TRUE)
				{
					$failed++;
					echo "Test run $i:failed - ".$name." UNABLE TO DELETE".PHP_EOL;
				}
			}
			
			echo "Count failed - ".$failed.PHP_EOL;
		}

    }
}
