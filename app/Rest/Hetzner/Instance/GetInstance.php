<?php

namespace App\Rest\Hetzner\Instance;

use Illuminate\Support\Facades\Http;

class GetInstance 
{
	private $api_key;
	private $name;
	private $id;
	
	public function __construct($api_key=null,$name=null) {
		$this->api_key=$api_key;
		$this->name=$name;

    }

	public function getID($retry=3)
	{
		if($retry<0)return FALSE;
		for($i=0;;$i++)
		{
			sleep(3-$retry);
			$response = Http::withToken($this->api_key)->get("https://api.hetzner.cloud/v1/servers/?page=".$i."&per_page=50");
			
			$data=$response->json();
			if(!isset($data['meta']['pagination']))return $this->getID($retry-1);
			if($data['meta']['pagination']['last_page']<$i)return $this->getID($retry-1);
			foreach($data['servers'] as $server)
			{
				if($server['name']==$this->name)
				{
					return $server['id'];
				}
			}
			
		}
		
		return $this->getID($retry-1);
	}



	public function execute($retry=3)
	{
		sleep(1);
		if($retry<0)return FALSE;
		if($retry<3)sleep(3-$retry);
		
		
		
		
		
		$id=$this->getID();
if($id==false)return false;
		
		
		
		
		$response = Http::withToken($this->api_key)->get("https://api.hetzner.cloud/v1/servers/".$id);
		$data=$response->json();
		if(isset($data['server']))
		{
			$server=$data['server'];
			if(isset($server['public_net']['ipv4']['ip']) && isset($server['name']) && isset($server['id']) && isset($server['status']))
			{
				return array(
					'name'=>$server['name'],
					'id'=>$server['id'],
					'ip'=>$server['public_net']['ipv4']['ip'],
					'status'=>$server['status']		
				);
				
			}
			else
			{
				return $this->execute($retry-1);
			}
		}
		else
		{
			return $this->execute($retry-1);
		}
	
}
}

