<?php

namespace App\Jobs\Google;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;

use App\Rest\Google\Instance\GetInstance;
use App\Rest\Google\Instance\CreateInstance;
use App\Rest\Google\Instance\DeleteInstance;

use App\Models\User;
use App\Models\UserCloudVm;
use App\Models\Cloud;
use App\Models\Vm;
use App\Models\Iamtoken;
use Illuminate\Support\Str;
use App\Models\UserCloudVmLog;
use App\Jobs\Google\ActionStop;
use Illuminate\Support\Facades\Storage;
class ActionStart implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
	 public $timeout = 6000;
	 protected $uservm;
	 private $response;
    public function __construct(UserCloudVm $uservm)
    {
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
			$info=new CreateInstance($name,$this->uservm->template_id,$cloud->project,Storage::path($cloud->path));
			$response=$info->execute();


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
					$info=new GetInstance($instanceId,$cloud->project,Storage::path($cloud->path));
					$response=$info->execute();	
				var_dump($response);				
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


						
				Bus::chain([new Timeout( $this->uservm)])->onQueue('google')->dispatch($this->uservm);
				return;

			}
			ActionStop::dispatch($this->uservm)->onQueue('google');
			
			
			

			
			
			
			
    }

}
