<?php
namespace App\Rest\Yandex\Image;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;


class Get
{
	private $id;
	private $token;

	private $url="https://compute.api.cloud.yandex.net/compute/v1/images/";
	public function __construct($id=null,$token) {
		$this->id=$id;
		$this->token=$token;

    }

	public function execute($retry=3)
	{
		sleep(1);
		if($retry<0)return null;
		if($retry<3)sleep(3-$retry);
		

			try
			{
				$client = new Client([
				'base_uri' => $this->url.$this->id,
				'timeout'  => 10.0,
				'headers' => ['Authorization' => 'Bearer '.$this->token]
			
				]);
		
				$response=$client->request('GET');

				$body=json_decode($response->getBody());
				if(!isset($body->{'id'}))return null;
				return $body;
			}
				catch (RequestException $e) {
				var_dump($e->getResponse());
					if ($e->hasResponse()) {
						if($e->getResponse()->getStatusCode()==404)//not found
							return null;
					}
					return $this->execute($retry-1);
				}
		}
}

