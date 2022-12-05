<?php
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
use Google\ApiCore\ApiException;

class CreateInstance 
{

    private $machine;
    private $sourceImage;
    private $network;
	private $zone;
	private $project;
	private $keypath;
	private $instanceName;
	
	public function __construct($instanceName,$sourceImage,$project,$machine,$zone,$network,$keypath) {
		$this->project=$project;
		$this->keypath=$keypath;
		$this->instanceName=$instanceName;
		$this->machine=$machine;
		$this->network=$network;
		$this->sourceImage=$sourceImage;
		$this->zone=$zone;
    }
	
	
	public function execute($retry=3)
	{
			sleep(1);
			if($retry<0)return false;
			if($retry<3)sleep(3-$retry);
		
			$req=array();
	
	
			putenv('GOOGLE_APPLICATION_CREDENTIALS='.$this->keypath);
			$machineTypeFullName = sprintf('zones/%s/machineTypes/%s', $this->zone,  $this->machine);
			$diskInitializeParams = (new AttachedDiskInitializeParams()) ->setSourceImage( $this->sourceImage);
			$disk = (new AttachedDisk())->setBoot(true) ->setAutoDelete(true)->setInitializeParams($diskInitializeParams);
			$network = (new NetworkInterface())        ->setName( $this->network);

				$networkConfig = new AccessConfig();
				$shled=new Scheduling();
				$shled->setPreemptible(true);
				$networkConfig->setName("External NAT");
				$networkConfig->setType(0);
				$network->setAccessConfigs(array($networkConfig));
					


			// Create the Instance object.
			$instance = (new Instance())->setName($this->instanceName)->setDisks([$disk])->setMachineType($machineTypeFullName)->setNetworkInterfaces([$network]);

			// Insert the new Compute Engine instance using InstancesClient.
			$instancesClient = new InstancesClient();
			try
			{
			
				$instancesClient->insert($instance, $this->project, $this->zone);
			}
			catch(ApiException $e)
			{
				return $this->execute($retry-1);
			}
			
			return $this->instanceName;

		}
}

