<?php

namespace App\Rest\Hetzner\Model;
use Illuminate\Support\Facades\Http;

class Instance
{
	private $API_KEY;
	private $image;
	public function __construct($API_KEY=null) {
		$this->API_KEY=$API_KEY;
		$this->image=new Image($this->API_KEY);
    }

	public function status($id)
	{
				/*
		initializing
		starting
		running
		stopping
		off
		deleting
		*/
		if(($result=$this->get($id))==false)return false;
		return $result['status'];
		
	}

	public function isCreating($id)
	{
		$status=$this->status($id);
		if($status=="initializing" || $status=="starting" )return true;
		return false;
	}

	public function isDeleting($id)
	{
		if($this->status($id)=="deleting")return true;
		return false;
	}



	public function isStopping($id)
	{
		if($this->status($id)=="stopping")return true;
		return false;
	}


	public function isStopped($id)
	{
		if($this->status($id)=="off")return true;
		return false;
	}


	public function isRunning($id)
	{
		if($this->status($id)=="running")return true;
		return false;
	}





	public function get($id)
	{
		$result=$this-> getById($id);
		if($result!==false)return $result;
		
		return $this->getByName($id);
		
	}


	private function getById($id)
	{
		foreach($this->list() as $entry)
		{
			if($entry['id']==$id)return $entry;
		}
		return FALSE;
	}

	private function getByName($name)
	{
		foreach($this->list() as $entry)
		{
			if($entry['name']==$name)return $entry;
		}
		return FALSE;
	}


	public function list()
	{	
		$resultArray=array();
		
		
		for($i=1;;$i++)
		{
			$response = Http::withToken($this->API_KEY)->retry(3, 100)->get("https://api.hetzner.cloud/v1/servers/?page=".$i."&per_page=50")->json();
			if(!isset($response['meta']['pagination']))break;
			
			foreach($response['servers'] as $server)
			{
				
				$ipv4=false;
				$ipv6=false;
				if(isset($server['public_net']['ipv4']['ip']))$ipv4=$server['public_net']['ipv4']['ip'];
				if(isset($server['public_net']['ipv6']['ip']))$ipv6=$server['public_net']['ipv6']['ip'];
				
				array_push($resultArray,
							array(
								'name'=>$server['name'],
								'id'=>$server['id'],
								'ipv4'=>$ipv4,
								'ipv6'=>$ipv6,
								'status'=>$server['status'],
								'private_net'=>$server['private_net']
							)
								
						);
			}
			if($response['meta']['pagination']['last_page']<=$i)break;
		}
			
		return $resultArray;

		}
		
		
		public function stop($id)
		{
			$vm=$this->get($id);
			if($vm==false)return false;
			$response = Http::withToken($this->API_KEY)->post("https://api.hetzner.cloud/v1/servers/".$vm['id']."/actions/poweroff",['id'=>$vm['id']]);
			return $response->successful();
		}

		public function delete($id)
		{
			$this->stop($id);
			$vm=$this->get($id);
			if($vm==false)return false;
			$response = Http::withToken($this->API_KEY)->delete("https://api.hetzner.cloud/v1/servers/".$vm['id']);
			return $response->successful();
		}
		
		
		public function attach_to_network($id,$network,$ip=null)
		{
			$server=$this->get($id);
			if($server==false)return false;
			if(!is_null($ip))
			{
			$response = Http::withToken($this->API_KEY)->post('https://api.hetzner.cloud/v1/servers/'.$server['id'].'/actions/attach_to_network', [
					  "ip"=> $ip,
					  "network"=>$network
				]);
			}
			else
			{
				$response = Http::withToken($this->API_KEY)->post('https://api.hetzner.cloud/v1/servers/'.$server['id'].'/actions/attach_to_network', [
					  "network"=>$network
				]);
			}				
			return $response->successful();

			
			
		}
		
		
		
		
	public function create(
						$name,
						$image_name,
						$user_data="",
						$server_type=null,
						$enable_ipv4=true,
						$enable_ipv6=true,
						$dc_location=false
						
		)
	{
	
			if(($image_entry=$this->image->get($image_name))==FALSE)return false;

			$image_id=$image_entry['id'];

			if($dc_location==false)
			{
				$dc_location=env('HETZNER_DC_LOCATION', false);
			}
				if(is_null($server_type))
			{
				$server_type=env('HETZNER_SERVER_TYPE', false);
			}
					
			$response = Http::withToken($this->API_KEY)->post('https://api.hetzner.cloud/v1/servers', [
					'location' => $dc_location,
					'image' => $image_id,
					 'name' => $name,
					   "public_net"=> 
					   array(
					   "enable_ipv6"=> $enable_ipv4,
						"enable_ipv6"=>$enable_ipv6,
					  ),
					 "user_data"=>$user_data,
					 "server_type"=>$server_type,
						'start_after_create' => true
				]);
			$data=$response->json();
			if(!isset($data['server']['name']))return FALSE;		
			return $this->get($data['server']['name']);

		}
		
		
		
		
		
		
}

