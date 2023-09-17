<?php
namespace App\Rest\Cloudflare;
use Illuminate\Support\Facades\Http;
class Cloudflare
{
    private $API_KEY;
    private $ZONE_ID;
	private $ZONE_NAME;
	public function __construct($API_KEY=false,$ZONE_NAME=false) {
		


		$this->API_KEY=$API_KEY;
		if($API_KEY==FALSE)
			$this->API_KEY=env('CLOUDFLARE_API', false);
		
		
		$this->ZONE_NAME=$ZONE_NAME;
			$response = Http::withToken($this->API_KEY)->acceptJson()->retry(3, 100)->get('https://api.cloudflare.com/client/v4/zones/')->json();
			if(isset($response['result']))
			foreach($response['result'] as $entry)
			{
				if(isset($entry['id']))
				{
					if($this->ZONE_NAME==false)
					{
						$this->ZONE_ID=$entry['id'];
						$this->ZONE_NAME=$entry['name'];
						break;
					}
					else
					{
						if($entry['name']==$this->ZONE_NAME)
						{
							$this->ZONE_ID=$entry['id'];
							break;
						}
					}
				}
			}
		}
    
	
	
	
	public function list()
	{
			$page=1;
			$resultArray=array();
			while(true)
			{
				$response = Http::withToken($this->API_KEY)->acceptJson()->retry(3, 100)->get('https://api.cloudflare.com/client/v4/zones/'.$this->ZONE_ID.'/dns_records',['page' => $page])->json();
				if(!isset($response['result_info']))break;
				if(!isset($response['result']))break;
				foreach($response['result'] as $entry)
				{
				   if($entry['name']!=$this->ZONE_NAME && ($entry['type']=="A" || $entry['type']=="AAAA"))
				   {
					  array_push($resultArray,array("id"=>$entry['id'],"name"=>$entry['name'],'ip'=>$entry['content']));
				   }
				}	
				if(	$page>=$response['result_info']['total_pages'])break;
				$page++;
			}
			
			return $resultArray;

	}
	
	
	public function getByName($name)
	{
		$name=strtolower($name);
		if(!str_ends_with($name,$this->ZONE_NAME))
		{
			$name=$name.".".$this->ZONE_NAME;
		}
		$all_entries= $this->list();
		 $resultArray=array();
		 foreach($all_entries as $entry)
		 {
			 if($entry['name']==$name)
			 {
				  array_push($resultArray,$entry);
			 }
		 }
		 
		 
		return $resultArray;
	}
	 
	public function checkIfNameExist($name)
	{
		$name=strtolower($name);
		if(count($this->getByName($name))>0)return true;
		 
		 
		return false;
	}
	
	public function create($name,$ip,$force=false)
	{
		if(is_null($name) || is_null($ip))return  FALSE;
		$name=strtolower($name);
			if($this->checkIfNameExist($name) && ($force==false || is_null($force)))
			{
				return FALSE;
			}

			

			$response = Http::withToken($this->API_KEY)->
			acceptJson()->
			post('https://api.cloudflare.com/client/v4/zones/'.$this->ZONE_ID.'/dns_records',
			[
				"content"=> $ip,
				"name"=> $name,
				"proxied"=> true,
				"type"=> "A",
				"ttl"=> 600
			
			
			
			])->json();
			if(isset($response['result']))
			return $response['result']['id'];
			return false;
	}
		
	public function delete($name,$ip=false)
	{
			$name=strtolower($name);
			if(!$this->checkIfNameExist($name) )
			{
				return FALSE;
			}
			

			$toDeleteEntries=$this->getByName($name);
			foreach($toDeleteEntries as $entry)
			{
				if($ip===false || is_null($ip))
					Http::withToken($this->API_KEY)->acceptJson()->delete('https://api.cloudflare.com/client/v4/zones/'.$this->ZONE_ID.'/dns_records/'.$entry['id']);
				else
				{
					if($entry['ip']==$ip)
						Http::withToken($this->API_KEY)->acceptJson()->delete('https://api.cloudflare.com/client/v4/zones/'.$this->ZONE_ID.'/dns_records/'.$entry['id']);
				}
			}
	}
		
		
	public function truncate()
	{


			$toDeleteEntries=$this->list();
			foreach($toDeleteEntries as $entry)
			{
				$this->delete($entry['name']);
			}
	}
		
		
	
}

