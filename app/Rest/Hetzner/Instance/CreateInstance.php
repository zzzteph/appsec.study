<?php
namespace App\Rest\Hetzner\Instance;
use Illuminate\Support\Facades\Http;
class CreateInstance 
{

    private $api_key;
    private $dc_location;
    private $server_type;
	private $name;
	private $image_name;
	public function __construct($api_key,$dc_location,$server_type,$image_name,$name) {
		$this->api_key=$api_key;
		$this->dc_location=$dc_location;
		$this->server_type=$server_type;
		$this->image_name=$image_name;
		$this->name=$name;
    }
	
	public function getImageId($retry=3)
	{
		if($retry<0)return FALSE;
		for($i=0;;$i++)
		{
			sleep(3-$retry);
			$response = Http::withToken($this->api_key)->get("https://api.hetzner.cloud/v1/images?type=snapshot&page=".$i."&per_page=50");
			
			$data=$response->json();
			
			if(!isset($data['meta']['pagination']))return $this->getImageId($retry-1);
			if($data['meta']['pagination']['last_page']<$i)return $this->getImageId($retry-1);

			foreach($data['images'] as $image)
			{

				if($image['name']==$this->image_name || $image['description']==$this->image_name)
				{
	
					return $image['id'];
				}
			}
			
		}
		
		return $this->getImageId($retry-1);
	}
	
	
	
	public function execute($retry=3)
	{
			sleep(1);
			if($retry<0)return false;
			if($retry<3)sleep(3-$retry);
		
			$image_id=$this->getImageId();

			if($image_id==false)return false;
	
					
				$response = Http::withToken($this->api_key)->post('https://api.hetzner.cloud/v1/servers', [
					'location' => $this->dc_location,
					'image' => $image_id,
					 'name' => $this->name,
					 
					   "public_net"=> 
					   array(
						"enable_ipv6"=> false,
					  ),
					 
					  "server_type"=>$this->server_type,
						'start_after_create' => true
				]);
				
			$data=$response->json();
			var_dump($data);
			if(!isset($data['server']['name']))return $this->execute($retry-1);				
			return $data['server']['name'];

		}
}

