<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Rest\Hetzner\Instance\Get;
use App\Rest\Hetzner\Instance\Create;
use App\Rest\Hetzner\Instance\Delete;
use App\Rest\Hetzner\Instance\Stop;
use Carbon\Carbon;
class TestCloud extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:cloud';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Timeout scheduler for nodes';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
	 
	 function test()
	 {
		 
		$key = getenv('HETZNER_API_KEY');
	//	$info=new GetInstance($key,"ubuntu-2gb-nbg1-1");
	//	$response=$info->execute();		
	//	var_dump($response);
		
		$info=new Create($key,getenv('HETZNER_DC_LOCATION'),getenv('HETZNER_SERVER_TYPE'),"ubuntu-2gb-nbg1-1-1673650473","new-server");
		$response=$info->execute();		
		while(true)
		{
			$info=new Get($key,"new-server");
			$response=$info->execute();	
			echo $response['status'].PHP_EOL;
			if($response['status']=='running')break;
		}
		echo "Stoppping".PHP_EOL;
		$info=new Delete($key,"new-server");
		$response=$info->execute();		
		while(true)
		{
			$info=new Get($key,"new-server");
			$response=$info->execute();	
			if($response==false)break;
		
		}
		
		
		
		var_dump($response); 

		
		
	 }
	 
    public function handle()
    {
		for($i=0;$i<50;$i++)
			$this->test();
	
    }
}
