<?php
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: yandex/cloud/compute/v1/instance_service.proto

namespace App\Rest\Hetzner\Instance;
use Illuminate\Support\Facades\Http;
class Stop 
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
		$this->id=$this->getID();
		if($this->id==false)return true;
		echo "https://api.hetzner.cloud/v1/servers/".$this->id."/actions/poweroff";
		$response = Http::withToken($this->api_key)->post("https://api.hetzner.cloud/v1/servers/".$this->id."/actions/poweroff");
		$data=$response->json();
		var_dump($data);
		if(isset($data['action']['id']))
		{
			return $data['action']['id'];
		}
		else
		{
			return $this->execute($retry-1);
		}
	
}
}
