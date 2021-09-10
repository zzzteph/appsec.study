<?php
namespace App\Rest\Yandex\Instance;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class CreateInstance 
{
	private $folderId;
	private $name;
	private $zoneId;
	private $platformId;

	private $memory;
	private $cores;
	private $coreFraction;
	private $gpus;
	private $metadata;
	private $diskSize;
	private $imageId;
	private $subnetId;
	private $internalAddress;
	private $externalAddress;


	private $IamToken;

	private $url="https://compute.api.cloud.yandex.net/compute/v1/instances";
	
	public function __construct($folderId,$name,$diskSize,$imageId,$subnetId,$zone_id,$platform_id,$iamtoken) {
	
		//default settings
		$this->zoneId=$zone_id;
		$this->platformId=$platform_id;
		$this->memory=2147483648;
		$this->cores=2;
		$this->coreFraction=5;
		$this->gpus=0;
		$this->internalAddress=false;
		$this->externalAddress=true;
		$this->subnetId=$subnetId;
		
		$this->folderId=$folderId;
		$this->name=$name;
		$this->diskSize=$diskSize;
		$this->imageId=$imageId;
		$this->IamToken=$iamtoken;

    }
	public function execute($retry=3)
	{
		sleep(1);
		if($retry<0)return false;
		if($retry<3)sleep(3-$retry);
		
		$req=array();
	
		
		$req['folderId']=$this->folderId;
		$req['name']=$this->name;
		$req['zoneId']=$this->zoneId;
		$req['platformId']=$this->platformId;
		$req['resourcesSpec']['memory']=$this->memory;
		$req['resourcesSpec']['cores']=$this->cores;
		$req['resourcesSpec']['coreFraction']=$this->coreFraction;
		$req['resourcesSpec']['gpus']=$this->gpus;
		$req['schedulingPolicy']['preemptible']=TRUE;
		$req['bootDiskSpec']['autoDelete']=true;
		$req['bootDiskSpec']['diskSpec']['size']=$this->diskSize;
		
		$req['bootDiskSpec']['diskSpec']['imageId']=$this->imageId;
		$req['networkInterfaceSpecs']=array();
		$req['networkInterfaceSpecs'][0]['subnetId']=$this->subnetId;
		if($this->internalAddress!==false)
			$req['networkInterfaceSpecs'][0]['primaryV4AddressSpec']['address']=$this->internalAddress;
		else
			$req['networkInterfaceSpecs'][0]['primaryV4AddressSpec']['address']=null;
		if($this->externalAddress==true)
		$req['networkInterfaceSpecs'][0]['primaryV4AddressSpec']['oneToOneNatSpec']['ipVersion']='IPV4';


			try
			{
				$client = new Client([
				'base_uri' => $this->url,
				'timeout'  => 10.0,
				'headers' => ['Authorization' => 'Bearer '.$this->IamToken],
				'body'=>json_encode($req)
				]);
			
				$response=$client->request('POST');
				$body=json_decode($response->getBody());
				return array("instanceId"=>$body->{'metadata'}->{'instanceId'},"operationId"=>$body->{'id'});
			}
				catch (RequestException $e) {

					if ($e->hasResponse()) {
						if($e->getResponse()->getStatusCode()==429)//exhausted
						return 429;
						if($e->getResponse()->getStatusCode()==409)//ALREADY_EXISTS
						return 409;
					}
					
					//TODO put logging!
					return $this->execute($retry-1);
				}
	


		}
}

