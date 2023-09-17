<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Rest\Hetzner\Hetzner;
use Carbon\Carbon;
class HetznerCloud extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hetzner:cloud {type} {action} {--name=} {--range=} {--subnets=*} {--subnet=} {--network=} {--image=} {--user-data=""} {--server-type=} {--enable-ipv4=true} {--enable-ipv6=true} {--cli}';

    /**
     * The console command description.
     *						
     * @var string
     */
    protected $description = 'Manage Hetzner cloud actions ';

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

	public function instance($ht)
	{
		$action=$this->argument('action');
		if(	$action=="create")
		{	
			
	
	
			return $ht->instance()->create(
			$this->option('name'),
			$this->option('image'),
			$this->option('user-data'),
			$this->option('server-type'),
			filter_var(      $this->option('enable-ipv4'), FILTER_VALIDATE_BOOLEAN),
			filter_var(      $this->option('enable-ipv6'), FILTER_VALIDATE_BOOLEAN),
			false);			


		}
		else if(	$action=="delete")
		{
			return $ht->instance()->delete($this->option('name'));
		}
		else if(	$action=="get")
		{
			return $ht->instance()->get($this->option('name'));
		}		
		else if(	$action=="list")
		{
			return $ht->instance()->list();
		}	
		else if(	$action=="network")
		{
				
				$network=$ht->network()->get($this->option('network'));
				if(isset($network['id']))
				{
					return $ht->instance()->attach_to_network(
					$this->option('name'),
					$network['id'],
					$this->option('subnet'));	
				}
				return false;
			
		}			
		return null;	
	}
	public function network($ht)
	{
		$action=$this->argument('action');
		if(	$action=="create")
		{
			if(empty($this->option('subnets')))
			{
				return $ht->network()->create($this->option('name'),$this->option('range'),array($this->option('range')));
			}
			else
			{
				return $ht->network()->create($this->option('name'),$this->option('range'),$this->option('subnets'));
			}
		}
		else if(	$action=="delete")
		{
			return $ht->network()->delete($this->option('name'));
		}
		else if(	$action=="get")
		{
			return $ht->network()->get($this->option('name'));
		}		
		else if(	$action=="list")
		{
			return $ht->network()->list();
		}		
		return null;	
	}
	 
    public function handle()
    {
		
		
		
		
		
		
		$ht=new Hetzner();
		$type=$this->argument('type');
		$result=FALSE;
		if($type=='instance')
		{ 
			$result=$this->instance($ht);
		}
		if($type=='network')
		{ 
			$result=$this->network($ht);
		}
		if($this->option('cli'))
		{
			echo json_encode($result);
		}
		return $result;
		
    }
}
