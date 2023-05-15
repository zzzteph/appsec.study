<?php

namespace App\Jobs\Google;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Rest\Google\Instance\GetInstance;
use App\Rest\Google\Instance\CreateInstance;
use App\Models\UserCloudVm;
use App\Models\Cloud;
use Illuminate\Support\Str;
use App\Jobs\Timeout;
use App\Jobs\StopVM;
use Illuminate\Support\Facades\Storage;
class Start implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
	 public $timeout = 600;
	 protected $uservm;
    public function __construct(UserCloudVm $uservm)
    {
		 $this->onQueue('cloud');
         $this->uservm=$uservm;
    }


    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {

			$name="id-".$this->uservm->id."-user-".$this->uservm->user_id."-".strtolower(Str::random(5));	
			//public function __construct($instanceName=null$sourceImage=null,$projectId=null$keypath=null) {	
			$cloud=Cloud::first();		
			//($instanceName,$sourceImage,$project,$machine,$zone,$network,$keypath)
			$info=new CreateInstance($name,$this->uservm->template_id,$cloud->project,$cloud->machine,$cloud->zone,$cloud->network,$cloud->keyfile);
			$response=$info->execute();
			var_dump($response);

			if($response!==FALSE)
			{
				//public function __construct($name=null,$projectId=null,$keypath=null) 
				$instanceId=$response;
				$this->uservm->status="starting";
				$this->uservm->instance_id=$instanceId;
				$this->uservm->progress=5;
				$this->uservm->save();
				
				while(true)
				{
					$info=new GetInstance($instanceId,$cloud->project,$cloud->keyfile);
					if($info===FALSE)
					{
						$this->uservm->progress=100;
						$this->uservm->status='terminated';
						
						$this->uservm->save();	
						return;
					}
					$response=$info->execute();				
					if($this->uservm->progress<100)
					{
						$this->uservm->progress=$this->uservm->progress+1;
						$this->uservm->save();	
					}					
					if(isset($response['ip']))
					{	
						if(strlen($response['ip'])>3)
						{
							$this->uservm->ip=$response['ip'];
							$this->uservm->save();
							if($this->uservm->progress<100)
							{
								$this->uservm->progress=$this->uservm->progress+1;
								$this->uservm->save();
							}
							break;
						}
					}

				}


				Timeout::dispatch($this->uservm);		

				return;

			}
			StopVM::dispatch($this->uservm);
			
			
			

			
			
			
			
    }

}
