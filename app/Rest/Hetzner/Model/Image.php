<?php

namespace App\Rest\Hetzner\Model;
use Illuminate\Support\Facades\Http;

class Image
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


	public function list()
	{	
		$resultArray=array();
		
		
		for($i=1;;$i++)
		{
			$response = Http::withToken($this->API_KEY)->retry(3, 100)->get("https://api.hetzner.cloud/v1/images?page=".$i."&per_page=50")->json();
			if(!isset($response['meta']['pagination']))break;
			
			foreach($response['images'] as $image)
			{
			$name=$image['name'];
			if(is_null($name))$name=$image['description'];
				array_push($resultArray,
							array(
								'name'=>$name,
								'id'=>$image['id'],
							)
								
						);
			}
			if($response['meta']['pagination']['last_page']<=$i)break;
		}
		return $resultArray;

		}
		

		
		
		
		
		
		
}

