<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Rest\Hetzner\Instance\Create;
use App\Rest\Hetzner\Instance\Delete;
use App\Rest\Hetzner\Instance\Stop;
use App\Rest\Hetzner\Instance\Get;
use Carbon\Carbon;
class CloudInstance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cloud:instance 
	{cloud}
	{action}
	{--server-type=? : Whether the job should be queued}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cloud functions instance';


    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
	 
	 
	 function hetzner()
	 {
		$key = getenv('HETZNER_API_KEY');
		$location=getenv('HETZNER_DC_LOCATION');
		$server_type=getenv('HETZNER_SERVER_TYPE');
		if($this->argument('--server-type')!==null)
			$type=getenv('HETZNER_SERVER_TYPE');



		$info=new Create($key,$location,$server_type,"test","new-server");
		echo "Creating";
		$response=$info->execute();	
		echo "FFFU";
		var_dump($response);		
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
	 
	 function test()
	 {
		 
		$key = getenv('HETZNER_API_KEY');
	//	$info=new GetInstance($key,"ubuntu-2gb-nbg1-1");
	//	$response=$info->execute();		
	//	var_dump($response);
		
		$info=new Create($key,getenv('HETZNER_DC_LOCATION'),getenv('HETZNER_SERVER_TYPE'),"test","new-server");
		echo "Creating";
		$response=$info->execute();	
		echo "FFFU";
var_dump($response);		
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
		/*
		for($i=0;$i<50;$i++)
			$this->test();
	*/
	
	
	
    }
}
