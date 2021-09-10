<?php
namespace App\Rest\Yandex\Operation;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;


class GetOperation 
{
	private $operationId;
	private $IamToken;

	private $url="https://operation.api.cloud.yandex.net/operations/";
	public function __construct($operationId=null,$iamtoken) {
		$this->operationId=$operationId;
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
				'base_uri' => $this->url.$this->operationId,
				'timeout'  => 10.0,
				'headers' => ['Authorization' => 'Bearer '.$this->IamToken]
			
				]);

				$response=$client->request('GET');
				$body=json_decode($response->getBody());
				if(!isset($body->{'done'}))return null;
				return $body->{'done'};
			}
				catch (RequestException $e) {
				
					if ($e->hasResponse()) {
						if($e->getResponse()->getStatusCode()==404)//not found
							return null;
					}
					return $this->execute($retry-1);
				}
	


		}
}

