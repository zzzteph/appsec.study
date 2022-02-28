<?php
namespace App\Rest\Yandex\Instance;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class DeleteInstance 
{
	private $instanceId;
	private $IamToken;

	private $url="https://compute.api.cloud.yandex.net/compute/v1/instances/";
	public function __construct($instanceId=null,$iamtoken) {
		$this->instanceId=$instanceId;
		$this->IamToken=$iamtoken;

    }

	public function execute($retry=3)
	{
		sleep(1);
		if($retry<0)return null;
		if($retry<3)sleep(3-$retry);
		
		
			try
			{
				$client = new Client([
				'base_uri' => $this->url.$this->instanceId,
				'timeout'  => 10.0,
				'headers' => ['Authorization' => 'Bearer '.$this->IamToken]
			
				]);

				$response=$client->request('DELETE');
				$body=json_decode($response->getBody());
				return $response->getBody();
				if(!isset($body->{'id'}))return null;
				return $body->{'id'};
			}
				catch (RequestException $e) {
				
					if ($e->hasResponse()) {
						if($e->getResponse()->getStatusCode()==404)//not found
							return null;
					}
					return $e->getResponse();
					return $this->execute($retry-1);
				}
	


		}
}

