<?php

namespace App\Rest\Hetzner\Model;
use Illuminate\Support\Facades\Http;

class PrimaryIP
{
	private $API_KEY;
	public function __construct($API_KEY=null) {
		$this->API_KEY=$API_KEY;

    }


	public function get($id)
	{
		return $this-> getById($id);

		
	}

	private function getById($id)
	{
		foreach($this->list() as $entry)
		{
			if($entry['id']==$id)return $entry;
		}
		return FALSE;
	}



	public function list()
	{	
		$resultArray=array();
		
		
		for($i=1;;$i++)
		{
			$response = Http::withToken($this->API_KEY)->retry(3, 100)->get("https://api.hetzner.cloud/v1/primary_ips?page=".$i."&per_page=50")->json();
			if(!isset($response['meta']['pagination']))break;
			
			foreach($response['primary_ips'] as $entry)
			{
				array_push($resultArray,
							array(
								'ip'=>$entry['ip'],
								'id'=>$entry['id'],
							)
								
						);
			}
			if($response['meta']['pagination']['last_page']<=$i)break;
		}
			
		return $resultArray;

		}
		
		
		
		
		
		
		
		
}

