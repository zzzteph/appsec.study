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

class CreateInstance 
{
  //  string $projectId="appsecstudy",
   // string $zone=,
    private $machineType;// = ,
    private $sourceImage;// = 'projects/appsecstudy/global/images/rce-attack-1',
    private $networkName;// = ''
		private $zone;
	private $projectId;
	private $keypath;
	private $instanceName;
	
	public function __construct($instanceName=null,$sourceImage=null,$projectId=null,$keypath=null) {
		$this->projectId=$projectId;
		$this->keypath=$keypath;
		$this->instanceName=$instanceName;
		$this->machineType='n1-standard-1';
		$this->networkName="global/networks/default";
		$this->sourceImage=$sourceImage;
		$this->zone="us-central1-a";
    }
	
	
	public function execute($retry=3)
	{
		sleep(1);
		if($retry<0)return false;
		if($retry<3)sleep(3-$retry);
		
		$req=array();
	
	
			putenv('GOOGLE_APPLICATION_CREDENTIALS='.$this->keypath);
			$machineTypeFullName = sprintf('zones/%s/machineTypes/%s', $this->zone,  $this->machineType);
			$diskInitializeParams = (new AttachedDiskInitializeParams()) ->setSourceImage( $this->sourceImage);
			$disk = (new AttachedDisk())->setBoot(true) ->setAutoDelete(true)->setInitializeParams($diskInitializeParams);
			$network = (new NetworkInterface())        ->setName( $this->networkName);

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
				$instancesClient->insert($instance, $this->projectId, $this->zone);
			}
			catch(Google\ApiCore\ApiException $e)
			{
				return $this->execute($retry-1);
			}
			
			return $this->instanceName;

		}
}

