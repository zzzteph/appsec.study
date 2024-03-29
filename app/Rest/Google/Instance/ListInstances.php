<?php
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: yandex/cloud/compute/v1/instance_service.proto

namespace App\Rest\Google\Instance;


use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Google\Cloud\Compute\V1\InstancesClient;
use Google\Cloud\Compute\V1\AttachedDisk;
use Google\Cloud\Compute\V1\AttachedDiskInitializeParams;
use Google\Cloud\Compute\V1\Instance;
use Google\Cloud\Compute\V1\NetworkInterface;
use Google\Cloud\Compute\V1\Operation;
use Google\Cloud\Compute\V1\ZoneOperationsClient;
use Google\Cloud\Compute\V1\AccessConfig;
use Google\Cloud\Compute\V1\Scheduling;


class ListInstances 
{
	private $project;
	private $keypath;
	public function __construct($project=null,$keypath=null) {
		$this->project=$project;
		$this->keypath=$keypath;
    }

	public function execute($retry=3)
	{
		sleep(1);
		if($retry<0)return array();
		if($retry<3)sleep(3-$retry);
		$result=array();
		putenv('GOOGLE_APPLICATION_CREDENTIALS='.$this->keypath);
		try
		{
			$instancesClient = new InstancesClient();
			$allInstances = $instancesClient->aggregatedList($this->project);
			foreach ($allInstances as $zone => $zoneInstances) {
				$instances = $zoneInstances->getInstances();
				if (count($instances) > 0) {
					
					foreach ($instances as $instance) {
						
						array_push($result,
							array(
								'name'=>$instance->getName(),
								'id'=>$instance->getId(),
								'ip'=>$instance->getNetworkInterfaces()[0]->getAccessConfigs()[0]->getNatIp(),
								'status'=>$instance->getStatus())
								
						);
								

					}
				}
			}
		}
		catch(Google\ApiCore\ApiException $e)
		{
			return $this->execute($retry-1);
		}
		return $result;

		}
}

