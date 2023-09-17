<?php

namespace App\Rest\Hetzner\Model;
use Illuminate\Support\Facades\Http;

class Network
{
	private $API_KEY;
	public function __construct($API_KEY=null) {
		$this->API_KEY=$API_KEY;
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

		public function delete($id)
		{

			$network=$this->get($id);
			if($network==false)return false;
			$response = Http::withToken($this->API_KEY)->delete("https://api.hetzner.cloud/v1/networks/".$network['id']);
			return $response->successful();
		}
		



	public function list()
	{	
		$resultArray=array();
		
		
		for($i=1;;$i++)
		{
			$response = Http::withToken($this->API_KEY)->retry(3, 100)->get("https://api.hetzner.cloud/v1/networks/?page=".$i."&per_page=50")->json();
			if(!isset($response['meta']['pagination']))break;
			
			foreach($response['networks'] as $network)
			{
				array_push($resultArray,
							array(
								'id'=>$network['id'],
								'name'=>$network['name'],
								'ip_range'=>$network['ip_range']
							)
								
						);
			}
			if($response['meta']['pagination']['last_page']<=$i)break;
		}
			
		return $resultArray;

		}
		
		public function create($name,$ip_range="10.0.0.0/16",$subnets=false)
		{	
			
			
			
			if($subnets==false)
			{
				$response = Http::withToken($this->API_KEY)->post('https://api.hetzner.cloud/v1/networks', [
					 'name' => $name,
					 "ip_range"=>$ip_range
				]);
			}
			else 
			{
				$subnetArray=array();
				foreach($subnets as $subnet)
				{
					array_push($subnetArray,array("ip_range"=>$subnet,"network_zone"=>"eu-central", "type"=> "cloud"));
				}
				$response = Http::withToken($this->API_KEY)->post('https://api.hetzner.cloud/v1/networks', [
					 'name' => $name,
					 'ip_range'=>$ip_range,
					 'subnets'=>$subnetArray
					  
				]);
			}
			$data=$response->json();
			if(!isset($data['network']['name']))return FALSE;		
			return $this->get($data['network']['name']);
		
		

		}



		
		
		
		
		
		
}

