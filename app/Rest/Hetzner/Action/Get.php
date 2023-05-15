<?php

namespace App\Rest\Hetzner\Action;

use Illuminate\Support\Facades\Http;

class Get 
{
	private $api_key;
	private $id;
	
	public function __construct($api_key=null,$id=null) {
		$this->api_key=$api_key;
		$this->id=$id;

    }





	public function execute($retry=3)
	{
		sleep(1);
		if($retry<0)return FALSE;
		if($retry<3)sleep(3-$retry);

		
		
		
		$response = Http::withToken($this->api_key)->get("https://api.hetzner.cloud/v1/actions/".$this->id);
		$data=$response->json();
		if(isset($data['status']))
		{
			return $data['status'];
		}
		else
		{
			return $this->execute($retry-1);
		}
	
}
}

